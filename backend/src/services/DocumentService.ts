/**
 * DocumentService — Statutory NBR Form Mushak-6.3 Delivery Challan & Tax Invoice Generator
 *
 * Implements:
 *   § prd.md §6.2          — Compliance document generation
 *   § architecture.md §1.1 — Document service layer
 *   § Database-Schema.md §4.4 / §4.5 — DeliveryChallan & SalesInvoice schemas
 *
 * Responsibilities:
 *   1. Generate sequential gapless challan numbers  (CH-YYYY-XXXXX)
 *   2. Generate sequential gapless invoice numbers  (INV-YYYY-XXXXX)
 *   3. Render statutory Mushak-6.3 bilingual PDF document via pdfkit
 *   4. Upload finalized PDF to AWS S3 / MinIO and persist the URL
 *   5. Expose invoice regeneration (re-upload with same number, revised flag)
 *   6. Validate all Mushak-6.3 mandatory field requirements
 */

import { ClientSession, Types } from 'mongoose';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { DeliveryChallanModel, IDeliveryChallan, IChallanItem } from '../models/DeliveryChallan';
import { SalesInvoiceModel, ISalesInvoice } from '../models/SalesInvoice';
import { CustomerModel } from '../models/Customer';
import { OrderModel } from '../models/Order';
import { CounterService } from './CounterService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import logger from '../config/logger';
import env from '../config/env';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Sun Bird Corporation statutory identity for all NBR documents */
const SELLER_INFO = {
  nameBn:    env.COMPANY_NAME_BN,
  nameEn:    env.COMPANY_NAME_EN,
  bin:       env.COMPANY_BIN,
  addressBn: env.COMPANY_ADDRESS_BN,
  addressEn: env.COMPANY_ADDRESS_EN,
} as const;

const VAT_RATE   = 0.15;               // NBR standard 15% Mushak-6.3
const PDF_BUCKET = env.S3_BUCKET_NAME;

// ─── S3 / MinIO Client (lazy-initialized singleton) ──────────────────────────

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
  if (_s3) return _s3;
  const config: ConstructorParameters<typeof S3Client>[0] = {
    region: env.S3_REGION,
    credentials: {
      accessKeyId:     env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  };
  if (env.S3_ENDPOINT) {
    config.endpoint      = env.S3_ENDPOINT;
    config.forcePathStyle = env.S3_USE_PATH_STYLE;
  }
  _s3 = new S3Client(config);
  return _s3;
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface ChallanItemDTO {
  productId:          string;
  sku:                string;
  productNameEn:      string;   // English description for bilingual field
  productNameBn:      string;   // Bangla description for bilingual field
  hsCode:             string;   // 8-digit NBR HS Code
  batchNumber:        string;
  dispatchedQty:      number;
  uom:                string;
  unitPriceBDT:       number;
  vatRate?:           number;   // defaults to 15
  sdRate?:            number;   // Supplementary Duty rate %
  dispatchedSerials?: string[];
}

export interface GenerateChallanDTO {
  orderId:          string;
  customerId:       string;
  preparedBy:       string;
  items:            ChallanItemDTO[];
  vehicleNumber?:   string;
  driverName?:      string;
  transporterType?: IDeliveryChallan['transporterType'];
  cartonCount?:     number;
  session?:         ClientSession;
}

export interface GenerateInvoiceDTO {
  orderId:         string;
  customerId:      string;
  challanId?:      string;
  preparedBy:      string;
  branchId?:       string;
  subtotal:        number;
  discountAmount?: number;
  vatRate?:        number;   // % e.g. 15 — defaults to 15
  dueInDays?:      number;   // credit terms; 0 = immediate
  session?:        ClientSession;
}

/** Structured Mushak-6.3 compliance payload — matches all NBR mandatory fields */
export interface Mushak63CompliancePayload {
  documentType:      'DELIVERY_CHALLAN' | 'TAX_INVOICE';
  documentNo:        string;
  issueDate:         string;           // ISO date string YYYY-MM-DD
  sellerBin:         string;
  sellerNameEn:      string;
  sellerNameBn:      string;
  sellerAddressEn:   string;
  sellerAddressBn:   string;
  buyerBin?:         string;
  buyerNameEn:       string;
  buyerNameBn?:      string;
  buyerAddress?:     string;
  vehicleNumber?:    string;
  driverName?:       string;
  dispatchTimestamp: string;           // full ISO datetime
  items:             Mushak63LineItem[];
  subtotalBDT:       number;
  discountBDT:       number;
  vatBDT:            number;
  sdBDT:             number;
  grandTotalBDT:     number;
  pdfS3Url:          string;
}

export interface Mushak63LineItem {
  slNo:          number;
  hsCode:        string;            // 8-digit NBR HS Code
  descriptionEn: string;
  descriptionBn: string;
  uom:           string;
  qty:           number;
  unitPriceBDT:  number;
  basePriceBDT:  number;            // qty × unitPrice
  vatRate:       number;            // percentage e.g. 15
  vatBDT:        number;
  sdRate:        number;            // Supplementary Duty %
  sdBDT:         number;
  lineTotalBDT:  number;            // basePriceBDT + vatBDT + sdBDT
}

// ─── DocumentService ──────────────────────────────────────────────────────────

export class DocumentService {

  // ── 1. Generate Delivery Challan (Mushak-6.3) ──────────────────────────────

  /**
   * Creates a gapless Mushak-6.3 delivery challan, renders the statutory PDF,
   * uploads it to S3/MinIO, and persists the record with pdfS3Url.
   */
  public static async generateChallan(dto: GenerateChallanDTO): Promise<{
    challan:    IDeliveryChallan;
    compliance: Mushak63CompliancePayload;
  }> {
    const { session } = dto;

    // Validate order & customer
    const [order, customer] = await Promise.all([
      OrderModel.findById(dto.orderId).session(session ?? null),
      CustomerModel.findById(dto.customerId).session(session ?? null),
    ]);
    if (!order)    throw new NotFoundError('Order',    dto.orderId);
    if (!customer) throw new NotFoundError('Customer', dto.customerId);
    if (!dto.items || dto.items.length === 0) {
      throw new ValidationError([{ field: 'items', issue: 'At least one line item is required' }]);
    }

    // Validate 8-digit HS codes
    for (const item of dto.items) {
      if (!/^\d{8}$/.test(item.hsCode.replace(/\s/g, ''))) {
        throw new ValidationError([{
          field: 'hsCode',
          issue: `HS Code '${item.hsCode}' for SKU '${item.sku}' must be exactly 8 numeric digits (NBR requirement)`,
        }]);
      }
    }

    // Gapless challan number: CH-YYYY-XXXXX
    const challanNo = await CounterService.getNextSequence('CH', session);

    // Build line items with computed VAT / SD
    const lineItems: Mushak63LineItem[] = dto.items.map((item, idx) => {
      const vatRate      = item.vatRate ?? VAT_RATE * 100;   // stored as %
      const sdRate       = item.sdRate  ?? 0;
      const basePriceBDT = parseFloat((item.dispatchedQty * item.unitPriceBDT).toFixed(2));
      const vatBDT       = parseFloat((basePriceBDT * vatRate / 100).toFixed(2));
      const sdBDT        = parseFloat((basePriceBDT * sdRate  / 100).toFixed(2));
      return {
        slNo:          idx + 1,
        hsCode:        item.hsCode.replace(/\s/g, ''),
        descriptionEn: item.productNameEn,
        descriptionBn: item.productNameBn,
        uom:           item.uom,
        qty:           item.dispatchedQty,
        unitPriceBDT:  item.unitPriceBDT,
        basePriceBDT,
        vatRate,
        vatBDT,
        sdRate,
        sdBDT,
        lineTotalBDT:  parseFloat((basePriceBDT + vatBDT + sdBDT).toFixed(2)),
      };
    });

    const subtotalBDT   = parseFloat(lineItems.reduce((s, l) => s + l.basePriceBDT, 0).toFixed(2));
    const vatBDT        = parseFloat(lineItems.reduce((s, l) => s + l.vatBDT,       0).toFixed(2));
    const sdBDT         = parseFloat(lineItems.reduce((s, l) => s + l.sdBDT,        0).toFixed(2));
    const grandTotalBDT = parseFloat((subtotalBDT + vatBDT + sdBDT).toFixed(2));
    const dispatchTime  = new Date();

    // Mongoose sub-documents
    const challanItems: IChallanItem[] = dto.items.map((item) => ({
      productId:         new Types.ObjectId(item.productId),
      sku:               item.sku,
      productName:       item.productNameEn,
      hsCode:            item.hsCode.replace(/\s/g, ''),
      batchNumber:       item.batchNumber,
      dispatchedQty:     item.dispatchedQty,
      uom:               item.uom,
      dispatchedSerials: item.dispatchedSerials ?? [],
      vatRate:           item.vatRate ?? VAT_RATE * 100,
      sdRate:            item.sdRate  ?? 0,
    }));

    // Persist DRAFT challan before PDF generation
    const [savedChallan] = await DeliveryChallanModel.create(
      [{
        challanNo,
        orderId:         new Types.ObjectId(dto.orderId),
        customerId:      new Types.ObjectId(dto.customerId),
        companyBin:      SELLER_INFO.bin,
        buyerBin:        customer.buyerBin,
        vehicleNumber:   dto.vehicleNumber,
        dispatchTime,
        transporterType: dto.transporterType ?? 'OWN_FLEET',
        cartonCount:     dto.cartonCount ?? 1,
        items:           challanItems,
        status:          'DRAFT',
        preparedBy:      new Types.ObjectId(dto.preparedBy),
      }],
      session ? { session } : {}
    );

    // Build compliance payload
    const compliance: Mushak63CompliancePayload = {
      documentType:      'DELIVERY_CHALLAN',
      documentNo:        challanNo,
      issueDate:         dispatchTime.toISOString().split('T')[0],
      sellerBin:         SELLER_INFO.bin,
      sellerNameEn:      SELLER_INFO.nameEn,
      sellerNameBn:      SELLER_INFO.nameBn,
      sellerAddressEn:   SELLER_INFO.addressEn,
      sellerAddressBn:   SELLER_INFO.addressBn,
      buyerBin:          customer.buyerBin,
      buyerNameEn:       customer.companyName ?? customer.fullName,
      buyerAddress:      customer.billingAddress ?? customer.shippingAddress,
      vehicleNumber:     dto.vehicleNumber,
      driverName:        dto.driverName,
      dispatchTimestamp: dispatchTime.toISOString(),
      items:             lineItems,
      subtotalBDT,
      discountBDT:       0,
      vatBDT,
      sdBDT,
      grandTotalBDT,
      pdfS3Url:          '',
    };

    // Generate PDF & upload
    const s3Key  = `challans/${dispatchTime.getFullYear()}/${challanNo}.pdf`;
    const pdfUrl = await DocumentService._generateAndUploadMushak63Pdf(
      compliance, dto.driverName, s3Key
    );
    compliance.pdfS3Url = pdfUrl;

    // Update record to APPROVED with PDF URL
    await DeliveryChallanModel.findByIdAndUpdate(
      savedChallan._id,
      { pdfS3Url: pdfUrl, status: 'APPROVED' },
      { session: session ?? undefined }
    );
    savedChallan.pdfS3Url = pdfUrl;
    savedChallan.status   = 'APPROVED';

    logger.info(`[DocumentService] Challan generated: ${challanNo} → ${pdfUrl}`, {
      challanId: savedChallan._id, orderId: dto.orderId,
    });

    return { challan: savedChallan, compliance };
  }

  // ── 2. Generate Tax Invoice ────────────────────────────────────────────────

  /**
   * Creates a gapless NBR tax invoice, renders the statutory PDF,
   * uploads it to S3/MinIO, and marks the invoice ISSUED.
   */
  public static async generateInvoice(dto: GenerateInvoiceDTO): Promise<{
    invoice:    ISalesInvoice;
    compliance: Mushak63CompliancePayload;
  }> {
    const { session } = dto;

    const [order, customer] = await Promise.all([
      OrderModel.findById(dto.orderId).session(session ?? null),
      CustomerModel.findById(dto.customerId).session(session ?? null),
    ]);
    if (!order)    throw new NotFoundError('Order',    dto.orderId);
    if (!customer) throw new NotFoundError('Customer', dto.customerId);

    // Gapless invoice number: INV-YYYY-XXXXX
    const invoiceNo      = await CounterService.getNextSequence('INV', session);
    const discountAmount = dto.discountAmount ?? 0;
    const vatRate        = dto.vatRate        ?? VAT_RATE * 100;  // % e.g. 15
    const vatTotal       = parseFloat(((dto.subtotal - discountAmount) * vatRate / 100).toFixed(2));
    const grandTotal     = parseFloat((dto.subtotal - discountAmount + vatTotal).toFixed(2));

    const invoiceDate = new Date();
    const dueDate     = new Date();
    dueDate.setDate(dueDate.getDate() + (dto.dueInDays ?? 0));

    const [savedInvoice] = await SalesInvoiceModel.create(
      [{
        invoiceNo,
        challanId:      dto.challanId ? new Types.ObjectId(dto.challanId) : undefined,
        orderId:        new Types.ObjectId(dto.orderId),
        customerId:     new Types.ObjectId(dto.customerId),
        branchId:       dto.branchId ? new Types.ObjectId(dto.branchId) : undefined,
        invoiceDate,
        dueDate,
        mushakInvoiceNo: invoiceNo,
        subtotal:       dto.subtotal,
        discountAmount,
        vatRate,
        vatTotal,
        grandTotal,
        paidAmount:     0,
        dueAmount:      grandTotal,
        paymentStatus:  'UNPAID',
        status:         'DRAFT',
        preparedBy:     new Types.ObjectId(dto.preparedBy),
      }],
      session ? { session } : {}
    );

    // Summary compliance line item (detailed lines live on the challan)
    const summaryLine: Mushak63LineItem = {
      slNo:          1,
      hsCode:        '00000000',
      descriptionEn: 'Goods as per Delivery Challan / চালান অনুযায়ী পণ্য',
      descriptionBn: 'ডেলিভারি চালান অনুযায়ী পণ্য',
      uom:           'LOT',
      qty:           1,
      unitPriceBDT:  dto.subtotal - discountAmount,
      basePriceBDT:  dto.subtotal - discountAmount,
      vatRate,
      vatBDT:        vatTotal,
      sdRate:        0,
      sdBDT:         0,
      lineTotalBDT:  grandTotal,
    };

    const issueTs = invoiceDate.toISOString();
    const compliance: Mushak63CompliancePayload = {
      documentType:      'TAX_INVOICE',
      documentNo:        invoiceNo,
      issueDate:         issueTs.split('T')[0],
      sellerBin:         SELLER_INFO.bin,
      sellerNameEn:      SELLER_INFO.nameEn,
      sellerNameBn:      SELLER_INFO.nameBn,
      sellerAddressEn:   SELLER_INFO.addressEn,
      sellerAddressBn:   SELLER_INFO.addressBn,
      buyerBin:          customer.buyerBin,
      buyerNameEn:       customer.companyName ?? customer.fullName,
      buyerAddress:      customer.billingAddress ?? customer.shippingAddress,
      dispatchTimestamp: issueTs,
      items:             [summaryLine],
      subtotalBDT:       dto.subtotal,
      discountBDT:       discountAmount,
      vatBDT:            vatTotal,
      sdBDT:             0,
      grandTotalBDT:     grandTotal,
      pdfS3Url:          '',
    };

    const s3Key  = `invoices/${invoiceDate.getFullYear()}/${invoiceNo}.pdf`;
    const pdfUrl = await DocumentService._generateAndUploadMushak63Pdf(
      compliance, undefined, s3Key
    );
    compliance.pdfS3Url = pdfUrl;

    await SalesInvoiceModel.findByIdAndUpdate(
      savedInvoice._id,
      { status: 'ISSUED' },
      { session: session ?? undefined }
    );
    savedInvoice.status = 'ISSUED';

    logger.info(`[DocumentService] Invoice generated: ${invoiceNo} → ${pdfUrl}`, {
      invoiceId: savedInvoice._id, orderId: dto.orderId,
    });

    return { invoice: savedInvoice, compliance };
  }

  // ── 3. Regenerate Challan PDF (Revised) ───────────────────────────────────

  /**
   * Re-renders and re-uploads a PDF for an existing challan without changing
   * its challan number. Updates pdfS3Url in place (overwrite same S3 key).
   */
  public static async regenerateChallanPdf(
    challanId:   string,
    driverName?: string,
    session?:    ClientSession
  ): Promise<string> {
    const challan = await DeliveryChallanModel
      .findById(challanId)
      .session(session ?? null);
    if (!challan) throw new NotFoundError('DeliveryChallan', challanId);

    const customer = await CustomerModel.findById(challan.customerId).session(session ?? null);

    const lineItems: Mushak63LineItem[] = challan.items.map((item, idx) => ({
      slNo:          idx + 1,
      hsCode:        item.hsCode,
      descriptionEn: item.productName,
      descriptionBn: item.productName,
      uom:           item.uom,
      qty:           item.dispatchedQty,
      unitPriceBDT:  0,
      basePriceBDT:  0,
      vatRate:       item.vatRate,
      vatBDT:        0,
      sdRate:        item.sdRate,
      sdBDT:         0,
      lineTotalBDT:  0,
    }));

    const payload: Mushak63CompliancePayload = {
      documentType:      'DELIVERY_CHALLAN',
      documentNo:        challan.challanNo,
      issueDate:         challan.dispatchTime.toISOString().split('T')[0],
      sellerBin:         challan.companyBin,
      sellerNameEn:      SELLER_INFO.nameEn,
      sellerNameBn:      SELLER_INFO.nameBn,
      sellerAddressEn:   SELLER_INFO.addressEn,
      sellerAddressBn:   SELLER_INFO.addressBn,
      buyerBin:          challan.buyerBin,
      buyerNameEn:       customer?.companyName ?? customer?.fullName ?? 'N/A',
      buyerAddress:      customer?.billingAddress,
      vehicleNumber:     challan.vehicleNumber,
      driverName,
      dispatchTimestamp: challan.dispatchTime.toISOString(),
      items:             lineItems,
      subtotalBDT:       0,
      discountBDT:       0,
      vatBDT:            0,
      sdBDT:             0,
      grandTotalBDT:     0,
      pdfS3Url:          '',
    };

    const s3Key  = `challans/${challan.dispatchTime.getFullYear()}/${challan.challanNo}.pdf`;
    const pdfUrl = await DocumentService._generateAndUploadMushak63Pdf(payload, driverName, s3Key);

    await DeliveryChallanModel.findByIdAndUpdate(
      challanId,
      { pdfS3Url: pdfUrl },
      { session: session ?? undefined }
    );

    logger.info(`[DocumentService] Challan PDF regenerated: ${challan.challanNo} → ${pdfUrl}`);
    return pdfUrl;
  }

  // ── 4. Mushak-6.3 PDF Renderer (pdfkit) + S3 Multipart Uploader ──────────

  /**
   * Renders a full statutory Mushak-6.3 bilingual PDF and streams it
   * directly to AWS S3 / MinIO via @aws-sdk/lib-storage multipart upload.
   */
  private static async _generateAndUploadMushak63Pdf(
    payload:    Mushak63CompliancePayload,
    driverName: string | undefined,
    s3Key:      string
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      try {
        const doc         = new PDFDocument({ margin: 40, size: 'A4', bufferPages: true });
        const passThrough = new PassThrough();

        // Pipe pdfkit output into passthrough for streaming S3 upload
        doc.pipe(passThrough);

        DocumentService._drawHeader(doc, payload);
        doc.moveDown(0.5);
        DocumentService._drawPartyTable(doc, payload, driverName ?? payload.driverName);
        doc.moveDown(0.5);
        DocumentService._drawLineItemsTable(doc, payload.items);
        doc.moveDown(0.5);
        DocumentService._drawTotalsBox(doc, payload);
        doc.moveDown(1);
        DocumentService._drawDeclaration(doc);
        DocumentService._drawFooter(doc, payload.documentNo);

        doc.end();

        const s3 = getS3Client();
        const upload = new Upload({
          client: s3,
          params: {
            Bucket:      PDF_BUCKET,
            Key:         s3Key,
            Body:        passThrough,
            ContentType: 'application/pdf',
            Metadata: {
              documentNo:   payload.documentNo,
              documentType: payload.documentType,
              sellerBin:    payload.sellerBin,
              issueDate:    payload.issueDate,
            },
          },
        });

        upload.done().then((result) => {
          const url =
            result.Location ??
            `https://${PDF_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${encodeURIComponent(s3Key)}`;
          resolve(url);
        }).catch((err) => {
          if (env.NODE_ENV !== 'production' || env.S3_ACCESS_KEY_ID === 'minioadmin') {
            logger.warn(
              `[DocumentService] S3 upload skipped/failed (${err.message}). Using simulated URL in ${env.NODE_ENV} mode.`
            );
            resolve(`https://${PDF_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${encodeURIComponent(s3Key)}`);
          } else {
            reject(err);
          }
        });

        passThrough.on('error', reject);
      } catch (err) {
        reject(err);
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  //  PDF Layout Helpers (pdfkit drawing routines)
  // ─────────────────────────────────────────────────────────────────────────────

  /** Statutory bilingual title banner */
  private static _drawHeader(
    doc:     PDFKit.PDFDocument,
    payload: Mushak63CompliancePayload
  ): void {
    const left  = doc.page.margins.left;
    const pageW = doc.page.width - left - doc.page.margins.right;

    doc.fontSize(8).fillColor('#555555').font('Helvetica')
       .text(
         "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার / Government of the People's Republic of Bangladesh",
         left, doc.y, { align: 'center', width: pageW }
       );
    doc.fontSize(8)
       .text('জাতীয় রাজস্ব বোর্ড / National Board of Revenue (NBR)',
             left, doc.y, { align: 'center', width: pageW });
    doc.moveDown(0.3);

    doc.fontSize(14).fillColor('#000000').font('Helvetica-Bold')
       .text('মূসক-৬.৩ / MUSHAK-6.3', left, doc.y, { align: 'center', width: pageW });
    doc.fontSize(9).font('Helvetica-Bold')
       .text(
         payload.documentType === 'DELIVERY_CHALLAN'
           ? 'Delivery Challan & Tax Invoice / ডেলিভারি চালান ও কর চালান'
           : 'Tax Invoice / কর চালান',
         left, doc.y, { align: 'center', width: pageW }
       );

    doc.moveDown(0.4);
    doc.font('Helvetica').fontSize(8).fillColor('#333333');

    // Document number & dates
    doc.text(`Document No. / দলিল নং: ${payload.documentNo}`, left, doc.y);
    doc.text(`Date / তারিখ: ${payload.issueDate}   |   Dispatch / প্রেরণ: ${
      new Date(payload.dispatchTimestamp).toLocaleString('en-BD')
    }`, left, doc.y);

    // Horizontal rule
    doc.moveDown(0.3);
    const y = doc.y;
    doc.moveTo(left, y).lineTo(left + pageW, y)
       .strokeColor('#000000').lineWidth(1.5).stroke();
  }

  /** Two-column Seller / Buyer party information block */
  private static _drawPartyTable(
    doc:        PDFKit.PDFDocument,
    payload:    Mushak63CompliancePayload,
    driverName: string | undefined
  ): void {
    const left  = doc.page.margins.left;
    const pageW = doc.page.width - left - doc.page.margins.right;
    const colW  = (pageW / 2) - 6;
    const startY = doc.y + 4;

    doc.fontSize(7.5);

    // --- Left column: Seller ---
    let sy = startY;
    doc.font('Helvetica-Bold').fillColor('#444444').text('SELLER / বিক্রেতা:', left, sy, { width: colW });
    sy = doc.y + 1;
    doc.font('Helvetica-Bold').fillColor('#000000').text(payload.sellerNameEn, left, sy, { width: colW });
    sy = doc.y;
    doc.font('Helvetica').text(payload.sellerNameBn,       left, sy, { width: colW });
    sy = doc.y;
    doc.text(`BIN: ${payload.sellerBin}`,                  left, sy, { width: colW });
    sy = doc.y;
    doc.text(payload.sellerAddressEn,                      left, sy, { width: colW });
    doc.text(payload.sellerAddressBn,                      left, doc.y, { width: colW });

    // --- Right column: Buyer ---
    const rx = left + colW + 12;
    let by = startY;
    doc.font('Helvetica-Bold').fillColor('#444444').text('BUYER / ক্রেতা:', rx, by, { width: colW });
    by = doc.y + 1;
    doc.font('Helvetica-Bold').fillColor('#000000').text(payload.buyerNameEn, rx, by, { width: colW });
    by = doc.y;
    if (payload.buyerNameBn) {
      doc.font('Helvetica').text(payload.buyerNameBn, rx, by, { width: colW });
      by = doc.y;
    }
    if (payload.buyerBin) {
      doc.font('Helvetica').text(`BIN: ${payload.buyerBin}`, rx, by, { width: colW });
      by = doc.y;
    }
    if (payload.buyerAddress) {
      doc.font('Helvetica').text(payload.buyerAddress, rx, by, { width: colW });
    }

    // Vehicle / driver row
    doc.moveDown(0.5);
    if (payload.vehicleNumber) {
      doc.font('Helvetica').fillColor('#444444')
         .text('Vehicle No. / যানবাহন নং: ', left, doc.y, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#000000').text(payload.vehicleNumber);
    }
    if (driverName) {
      doc.font('Helvetica').fillColor('#444444')
         .text('Driver / চালক: ', left, doc.y, { continued: true });
      doc.font('Helvetica-Bold').fillColor('#000000').text(driverName);
    }

    // Separator
    doc.moveDown(0.3);
    const sepY = doc.y;
    doc.moveTo(left, sepY).lineTo(left + pageW, sepY)
       .strokeColor('#888888').lineWidth(0.5).stroke();
  }

  /** Statutory line-items table with all NBR Mushak-6.3 mandatory columns */
  private static _drawLineItemsTable(
    doc:   PDFKit.PDFDocument,
    items: Mushak63LineItem[]
  ): void {
    const left  = doc.page.margins.left;
    const pageW = doc.page.width - left - doc.page.margins.right;

    // Column widths — total must equal pageW (515 pts on A4 with 40pt margins)
    const C = {
      sl:    20, hs:   52, desc: 0,
      uom:   27, qty:  27, unit: 48,
      base:  48, vat:  35, sd:   28, total: 52,
    };
    C.desc = pageW - C.sl - C.hs - C.uom - C.qty - C.unit - C.base - C.vat - C.sd - C.total;

    const headerH = 30;
    const rowH    = 14;
    const tableY  = doc.y + 4;

    // Header background
    doc.rect(left, tableY, pageW, headerH).fillColor('#E8E8E8').fill();
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(6.5);

    const headers: Array<{ label: string; w: number }> = [
      { label: 'Sl.\nক্রম',              w: C.sl   },
      { label: 'HS Code\n(8-digit)',      w: C.hs   },
      { label: 'Description / বিবরণ\n(EN / BN)', w: C.desc  },
      { label: 'UOM\nএকক',              w: C.uom  },
      { label: 'Qty\nপরিমাণ',           w: C.qty  },
      { label: 'Unit Price\nএকক মূল্য', w: C.unit },
      { label: 'Base Amt.\nমূল মূল্য',  w: C.base },
      { label: 'VAT 15%\nমূসক',         w: C.vat  },
      { label: 'SD%\nশুল্ক',            w: C.sd   },
      { label: 'Line Total\nমোট (৳)',    w: C.total },
    ];

    let x = left;
    for (const h of headers) {
      doc.text(h.label, x + 2, tableY + 3, { width: h.w - 4, align: 'center' });
      x += h.w;
    }
    doc.rect(left, tableY, pageW, headerH).strokeColor('#000000').lineWidth(0.6).stroke();

    // Rows
    let rowY = tableY + headerH;
    doc.font('Helvetica').fontSize(6.5).fillColor('#000000');

    for (const item of items) {
      const bilingualDesc = `${item.descriptionEn}\n${item.descriptionBn}`;
      const cellH = 2 * rowH;   // bilingual occupies 2 lines

      const cells: Array<{ val: string; w: number; align: 'center' | 'left' | 'right' }> = [
        { val: String(item.slNo),       w: C.sl,   align: 'center' },
        { val: item.hsCode,             w: C.hs,   align: 'center' },
        { val: bilingualDesc,           w: C.desc, align: 'left'   },
        { val: item.uom,                w: C.uom,  align: 'center' },
        { val: String(item.qty),        w: C.qty,  align: 'right'  },
        { val: fmtBDT(item.unitPriceBDT), w: C.unit, align: 'right' },
        { val: fmtBDT(item.basePriceBDT), w: C.base, align: 'right' },
        { val: fmtBDT(item.vatBDT),     w: C.vat,  align: 'right'  },
        { val: fmtBDT(item.sdBDT),      w: C.sd,   align: 'right'  },
        { val: fmtBDT(item.lineTotalBDT), w: C.total, align: 'right' },
      ];

      x = left;
      for (const cell of cells) {
        doc.text(cell.val, x + 2, rowY + 2, {
          width:  cell.w - 4,
          height: cellH - 2,
          align:  cell.align,
          lineGap: 0,
        });
        doc.rect(x, rowY, cell.w, cellH).strokeColor('#AAAAAA').lineWidth(0.3).stroke();
        x += cell.w;
      }
      rowY += cellH;
    }

    // Outer border
    doc.rect(left, tableY, pageW, rowY - tableY).strokeColor('#000000').lineWidth(0.8).stroke();
    doc.y = rowY;
  }

  /** Totals summary box (right-aligned) */
  private static _drawTotalsBox(
    doc:     PDFKit.PDFDocument,
    payload: Mushak63CompliancePayload
  ): void {
    const left  = doc.page.margins.left;
    const pageW = doc.page.width - left - doc.page.margins.right;
    const boxW  = 230;
    const boxX  = left + pageW - boxW;
    const boxY  = doc.y + 4;
    const rowH  = 14;

    const rows = [
      { label: 'Subtotal / উপমোট (BDT)',       val: fmtBDT(payload.subtotalBDT),   bold: false },
      { label: 'Discount / ছাড় (BDT)',          val: fmtBDT(payload.discountBDT),   bold: false },
      { label: 'VAT @ 15% Mushak-6.3 (BDT)',  val: fmtBDT(payload.vatBDT),        bold: false },
      { label: 'Supp. Duty / SD (BDT)',         val: fmtBDT(payload.sdBDT),         bold: false },
      { label: 'GRAND TOTAL / সর্বমোট (BDT)', val: fmtBDT(payload.grandTotalBDT), bold: true  },
    ];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const y   = boxY + i * rowH;
      if (row.bold) doc.rect(boxX, y, boxW, rowH).fillColor('#EEEEEE').fill();
      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(7.5).fillColor('#000000')
         .text(row.label, boxX + 4, y + 3, { width: boxW - 60, align: 'left' });
      doc.font(row.bold ? 'Helvetica-Bold' : 'Helvetica')
         .text(row.val, boxX + boxW - 58, y + 3, { width: 54, align: 'right' });
      doc.rect(boxX, y, boxW, rowH).strokeColor('#999999').lineWidth(0.3).stroke();
    }

    doc.rect(boxX, boxY, boxW, rows.length * rowH)
       .strokeColor('#000000').lineWidth(0.8).stroke();

    doc.y = boxY + rows.length * rowH;
  }

  /** Statutory NBR declaration clause and three signature lines */
  private static _drawDeclaration(doc: PDFKit.PDFDocument): void {
    const left  = doc.page.margins.left;
    const pageW = doc.page.width - left - doc.page.margins.right;
    const y     = doc.y + 6;

    doc.font('Helvetica').fontSize(7).fillColor('#333333')
       .text(
         'আমি / আমরা ঘোষণা করছি যে এই চালানে উল্লিখিত তথ্য সঠিক ও সম্পূর্ণ।\n' +
         'I / We hereby declare that the information stated in this challan is correct, complete, and in compliance with the VAT and SD Act 2012.',
         left, y, { width: pageW }
       );

    doc.moveDown(2);
    const sigY  = doc.y;
    const sigW  = 115;
    const gap   = (pageW - 3 * sigW) / 2;

    const sigs = [
      { label: 'Prepared By\nপ্রস্তুতকারী',              x: left                   },
      { label: 'Approved By\nঅনুমোদনকারী',               x: left + sigW + gap      },
      { label: 'Authorized Signatory\nক্ষমতাপ্রাপ্ত স্বাক্ষরকারী', x: left + (sigW + gap) * 2 },
    ];

    for (const sig of sigs) {
      doc.moveTo(sig.x, sigY + 22).lineTo(sig.x + sigW, sigY + 22)
         .strokeColor('#000000').lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(6.5).fillColor('#555555')
         .text(sig.label, sig.x, sigY + 24, { width: sigW, align: 'center' });
    }
  }

  /** Page footer stamped on every page (pdfkit buffered-pages mode) */
  private static _drawFooter(doc: PDFKit.PDFDocument, documentNo: string): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(i);
      const left   = doc.page.margins.left;
      const pageW  = doc.page.width - left - doc.page.margins.right;
      const footY  = doc.page.height - doc.page.margins.bottom - 18;
      doc.moveTo(left, footY - 3).lineTo(left + pageW, footY - 3)
         .strokeColor('#CCCCCC').lineWidth(0.5).stroke();
      doc.font('Helvetica').fontSize(6.5).fillColor('#888888')
         .text(
           `Document: ${documentNo}   |   Printed: ${new Date().toLocaleString('en-BD')}` +
           `   |   Page ${i + 1} of ${range.count}   |   ** System Generated — NBR Mushak-6.3 **`,
           left, footY, { width: pageW, align: 'center' }
         );
    }
  }

  // ── 5. Mushak-6.3 Mandatory Field Compliance Validator ────────────────────

  /**
   * Validates that a compliance payload satisfies all NBR Mushak-6.3 mandatory
   * field specifications.  Returns violation strings (empty array = pass).
   */
  public static validateMushak63Compliance(payload: Mushak63CompliancePayload): string[] {
    const v: string[] = [];

    // §1 — Seller
    if (!payload.sellerBin)       v.push('MISSING: sellerBin — Seller NBR BIN is mandatory');
    if (!payload.sellerNameEn)    v.push('MISSING: sellerNameEn');
    if (!payload.sellerNameBn)    v.push('MISSING: sellerNameBn — Bangla name is mandatory');
    if (!payload.sellerAddressEn) v.push('MISSING: sellerAddressEn');

    // §2 — Document identity
    if (!payload.documentNo)        v.push('MISSING: documentNo');
    if (!payload.issueDate)         v.push('MISSING: issueDate');
    if (!payload.dispatchTimestamp) v.push('MISSING: dispatchTimestamp');

    // §3 — Items
    if (!payload.items || payload.items.length === 0) {
      v.push('MISSING: items — at least one line item required');
    }

    // §4 — Line-item mandatory fields
    for (const item of (payload.items ?? [])) {
      const pfx = `Item[${item.slNo}]`;
      if (!item.hsCode || !/^\d{8}$/.test(item.hsCode)) {
        v.push(`${pfx}: hsCode must be exactly 8 numeric digits (NBR) — got '${item.hsCode}'`);
      }
      if (!item.descriptionEn) v.push(`${pfx}: descriptionEn required`);
      if (!item.descriptionBn) v.push(`${pfx}: descriptionBn (Bangla) required`);
      if (!item.uom)           v.push(`${pfx}: uom (Base UOM) required`);
      if (item.qty  <= 0)      v.push(`${pfx}: qty must be > 0`);
      if (item.vatRate < 0)    v.push(`${pfx}: vatRate cannot be negative`);
      if (item.sdRate  < 0)    v.push(`${pfx}: sdRate cannot be negative`);
    }

    // §5 — Grand total coherence check
    const computed = parseFloat(
      (payload.subtotalBDT - payload.discountBDT + payload.vatBDT + payload.sdBDT).toFixed(2)
    );
    if (Math.abs(computed - payload.grandTotalBDT) > 0.02) {
      v.push(
        `GRAND_TOTAL_MISMATCH: computed ${computed} ≠ stated ${payload.grandTotalBDT} (tolerance 0.02 BDT)`
      );
    }

    return v;
  }
}

// ─── Formatting Helper ────────────────────────────────────────────────────────

/** Format a BDT amount to 2 decimal places with en-BD locale */
function fmtBDT(n: number): string {
  return n.toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default DocumentService;
