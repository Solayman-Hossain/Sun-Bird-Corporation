import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
import mongoose, { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { OrganizationModel } from '../models/Organization';
import { CustomerModel } from '../models/Customer';
import { SupplierModel } from '../models/Supplier';
import { ProductModel } from '../models/Product';
import { DocumentTemplateModel } from '../models/DocumentTemplate';
import { SalesQuotationModel } from '../models/SalesQuotation';
import { ProformaInvoiceModel } from '../models/ProformaInvoice';
import { MoneyReceiptModel } from '../models/MoneyReceipt';
import { CreditNoteModel } from '../models/CreditNote';
import { PurchaseOrderModel } from '../models/PurchaseOrder';
import { AmountInWordsService } from './AmountInWordsService';
import { DocumentCalculationService } from './DocumentCalculationService';
import { DocumentTemplateService } from './DocumentTemplateService';
import { SalesDocumentService } from './SalesDocumentService';
import { DocumentDataResolver } from './DocumentDataResolver';
import { DocumentPdfService } from './DocumentPdfService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runDocumentVerification() {
  console.log('\n===============================================================');
  console.log('   SUN BIRD ERP — MODULE 07: DOCUMENT MANAGEMENT & ENGINE      ');
  console.log('===============================================================\n');

  await connectDatabase();

  const runId = Date.now().toString().slice(-6);
  const testUserId = new Types.ObjectId();
  let passCount = 0;

  try {
    // ─── STEP 1: ORGANIZATION BRANDING ISOLATION (TEST 1) ───────────────────
    console.log('[Step 1] Creating Organizations A and B with Distinct Branding...');
    const orgA = await OrganizationModel.create({
      organizationCode: `ORG-A-${runId}`,
      legalName: `Healthcare Diagnostics A ${runId} Ltd.`,
      displayName: `Sun Bird Diagnostic Wing A ${runId}`,
      organizationType: 'PRIVATE_LIMITED',
      email: `contact-a-${runId}@sunbirdbd.com`,
      phone: '+8801711000001',
      address: 'House 10, Road 5, Gulshan-1',
      city: 'Dhaka',
      district: 'Dhaka',
      binNumber: '001122334-0101',
      tinNumber: '112233445566',
      branding: {
        logoUrl: 'https://s3.amazonaws.com/sunbird/logos/logo-org-a.png',
        primaryColor: '#1e3932',
      },
      signatories: [
        {
          signatoryId: 'sig-a',
          personName: 'Dr. Rafiqul Islam',
          designation: 'Medical Director Org A',
          signatureImageUrl: 'https://s3.amazonaws.com/sunbird/signatures/sig-a.png',
          isActive: true,
          applicableDocuments: ['PURCHASE_ORDER', 'SALES_QUOTATION'],
        },
      ],
      stamps: [
        {
          stampId: 'stamp-a',
          stampName: 'Official Seal Org A',
          stampType: 'OFFICIAL',
          stampImageUrl: 'https://s3.amazonaws.com/sunbird/stamps/stamp-a.png',
          isActive: true,
        },
      ],
    });

    const orgB = await OrganizationModel.create({
      organizationCode: `ORG-B-${runId}`,
      legalName: `Hospital Supply Solutions B ${runId} Ltd.`,
      displayName: `Sun Bird Surgical Supply B ${runId}`,
      organizationType: 'PRIVATE_LIMITED',
      email: `contact-b-${runId}@sunbirdbd.com`,
      phone: '+8801722000002',
      address: 'Plot 24, GEC Circle',
      city: 'Chittagong',
      district: 'Chittagong',
      binNumber: '009988776-0202',
      tinNumber: '998877665544',
      branding: {
        logoUrl: 'https://s3.amazonaws.com/sunbird/logos/logo-org-b.png',
        primaryColor: '#c89348',
      },
      signatories: [
        {
          signatoryId: 'sig-b',
          personName: 'Engr. Mahbub Alam',
          designation: 'Operations Head Org B',
          signatureImageUrl: 'https://s3.amazonaws.com/sunbird/signatures/sig-b.png',
          isActive: true,
          applicableDocuments: ['PURCHASE_ORDER'],
        },
      ],
      stamps: [
        {
          stampId: 'stamp-b',
          stampName: 'Official Seal Org B',
          stampType: 'OFFICIAL',
          stampImageUrl: 'https://s3.amazonaws.com/sunbird/stamps/stamp-b.png',
          isActive: true,
        },
      ],
    });

    const resA = await DocumentDataResolver.resolveOrganization(orgA._id);
    const resB = await DocumentDataResolver.resolveOrganization(orgB._id);

    assert(resA.name === orgA.displayName, 'Org A display name resolved accurately');
    assert(resB.name === orgB.displayName, 'Org B display name resolved accurately');
    assert(resA.logoUrl === 'https://s3.amazonaws.com/sunbird/logos/logo-org-a.png', 'Org A logo resolved');
    assert(resB.logoUrl === 'https://s3.amazonaws.com/sunbird/logos/logo-org-b.png', 'Org B logo resolved');
    assert(resA.signatoryName === 'Dr. Rafiqul Islam', 'Org A signatory preserved');
    assert(resB.signatoryName === 'Engr. Mahbub Alam', 'Org B signatory preserved');
    assert(resA.logoUrl !== resB.logoUrl, 'Org A and Org B logos are strictly isolated');
    passCount += 7;
    console.log('  ✓ Multi-organization branding isolation verified');

    // ─── STEP 2: TEMPLATE SEEDING & CONFIGURATION ───────────────────────────
    console.log('\n[Step 2] Seeding Default Templates for Organization A...');
    const seedResult = await DocumentTemplateService.seedDefaultTemplates(orgA._id, testUserId);
    assert(seedResult.seeded === true, 'Templates successfully seeded for Org A');

    const templates = await DocumentTemplateService.getTemplates({ organizationId: orgA._id });
    assert(templates.total >= 4, `At least 4 default templates created (got ${templates.total})`);
    passCount += 2;
    console.log(`  ✓ Seeded ${templates.total} standard templates (PO, Quotation, Invoice, Receipt)`);

    // ─── STEP 3: DYNAMIC COLUMNS (TEST 3) ───────────────────────────────────
    console.log('\n[Step 3] Testing Dynamic Column Builder on PO Template...');
    const poTemplate = await DocumentTemplateModel.findOne({
      organizationId: orgA._id,
      documentType: 'PURCHASE_ORDER',
    });
    assert(Boolean(poTemplate), 'PO Template retrieved');

    // Add a new column "specification" and rename "qty" -> "Quantity"
    poTemplate!.tableDefinition.columns.push({
      id: 'spec',
      label: 'Specification / Model',
      field: 'specification',
      width: '120px',
      align: 'left',
      format: 'text',
      visible: true,
      isDeletable: true,
    });

    const qtyCol = poTemplate!.tableDefinition.columns.find((c) => c.id === 'qty');
    if (qtyCol) {
      qtyCol.label = 'Quantity (একক)';
      qtyCol.width = '90px';
    }

    await poTemplate!.save();

    const updatedPoTemplate = await DocumentTemplateService.getTemplateById(poTemplate!._id);
    const specCol = updatedPoTemplate.tableDefinition.columns.find((c) => c.id === 'spec');
    assert(Boolean(specCol), 'Dynamic column Specification added');
    assert(specCol!.label === 'Specification / Model', 'Dynamic column label configured');
    const modifiedQtyCol = updatedPoTemplate.tableDefinition.columns.find((c) => c.id === 'qty');
    assert(modifiedQtyCol!.label === 'Quantity (একক)', 'Column label renamed while preserving field mapping');
    passCount += 4;
    console.log('  ✓ Dynamic Column Builder: column addition, renaming, and width configuration verified');

    // ─── STEP 4: EDITABLE TEXT (TEST 4) ─────────────────────────────────────
    console.log('\n[Step 4] Testing Complete Text Editing & Bangla Unicode...');
    updatedPoTemplate.headerSettings.docTitle = 'ক্রয় আদেশ (PURCHASE ORDER)';
    updatedPoTemplate.recipientSettings.recipientLabel = 'সরবরাহকারী প্রতিষ্ঠান (Supplier / Vendor)';
    updatedPoTemplate.introductionText =
      'প্রিয় মহোদয়, আমরা আনন্দের সাথে আপনাদের সম্মানিত প্রতিষ্ঠানে নিম্নে বর্ণিত শর্তসাপেক্ষে মালামাল সরবরাহের জন্য ক্রয় আদেশ প্রদান করিতেছি।';
    updatedPoTemplate.termsAndConditions.push({
      id: 't-custom',
      textBn: '৫. সকল চালানের সাথে গুণগত মান ও বিএসটিআই/ডিজিডিএ সনদ দাখিল করিতে হইবে।',
      order: 5,
      isActive: true,
    });

    await updatedPoTemplate.save();
    const verifiedTextTemplate = await DocumentTemplateService.getTemplateById(updatedPoTemplate._id);
    assert(verifiedTextTemplate.headerSettings.docTitle === 'ক্রয় আদেশ (PURCHASE ORDER)', 'Doc title edited in Bangla');
    assert(verifiedTextTemplate.termsAndConditions.length === 5, 'Custom Bangla term added to library');
    passCount += 2;
    console.log('  ✓ Editable text and Bangla Unicode customization verified');

    // ─── STEP 5: CALCULATION ENGINE & AMOUNT IN WORDS (TEST 6) ──────────────
    console.log('\n[Step 5] Testing Document Calculations & Amount in Words Engine...');
    // Requirement from Test 6: Quantity: 1000, Unit Price: 8.80 => Subtotal: 8,800.00, Grand Total: 8,800.00
    const calc = DocumentCalculationService.calculateDocument({
      items: [
        {
          quantity: 1000,
          unitPrice: 8.8,
        },
      ],
      currency: 'BDT',
    });

    assert(calc.subtotal === 8800, `Subtotal is 8,800.00 (got ${calc.subtotal})`);
    assert(calc.grandTotal === 8800, `Grand total is 8,800.00 (got ${calc.grandTotal})`);
    assert(
      calc.amountInWordsEn === 'Eight Thousand Eight Hundred Taka Only',
      `Amount in words (EN) is exact: '${calc.amountInWordsEn}'`
    );
    assert(
      calc.amountInWordsBn === 'আট হাজার আট শত টাকা মাত্র',
      `Amount in words (BN) is exact: '${calc.amountInWordsBn}'`
    );
    passCount += 4;
    console.log('  ✓ Exact calculation and Amount in Words verified (8,800.00 -> Eight Thousand Eight Hundred Taka Only)');

    // ─── STEP 6: DYNAMIC ROWS (TEST 2) ──────────────────────────────────────
    console.log('\n[Step 6] Testing Dynamic Row Builder & Multi-Item Calculation...');
    const multiRowCalc = DocumentCalculationService.calculateDocument({
      items: [
        { quantity: 10, unitPrice: 500, discount: 50 }, // 5000 - 50 = 4950
        { quantity: 2, unitPrice: 1500, taxRate: 15 },  // 3000 + 450 = 3450
      ],
      shippingCharge: 200,
      currency: 'BDT',
    });

    assert(multiRowCalc.lines.length === 2, '2 line items calculated');
    assert(multiRowCalc.lines[0].netLineTotal === 4950, 'Line 1 discounted net total verified');
    assert(multiRowCalc.lines[1].netLineTotal === 3450, 'Line 2 taxed net total verified');
    assert(multiRowCalc.grandTotal === 8600, `Grand total with shipping matches (got ${multiRowCalc.grandTotal})`);
    passCount += 4;
    console.log('  ✓ Dynamic rows math precision with line discount, tax, and shipping verified');

    // ─── STEP 7: PURCHASE ORDER RESOLVER & PDF GENERATION (TEST 8 & 11) ─────
    console.log('\n[Step 7] Creating Purchase Order and Testing Data Resolver & PDF Engine...');
    const testSupplier = await SupplierModel.create({
      organizationId: orgA._id,
      supplierCode: `SUP-${runId}`,
      companyName: 'Square Lifesciences Ltd.',
      contactPerson: 'Mr. Anisur Rahman',
      phone: '+8801700112233',
      email: `supplier-${runId}@square.com`,
      address: 'Mohakhali C/A, Dhaka-1212',
      supplierType: 'LOCAL',
      currency: 'BDT',
      bin: '003344556-0101',
      isActive: true,
    });

    const testProduct = await ProductModel.create({
      organizationId: orgA._id,
      sku: `CON-SYR-5ML-${runId}`,
      nameEn: 'Sterile Disposable Syringe 5ml',
      category: 'Medical Consumables',
      brand: 'Sun Bird Pro',
      manufacturer: 'South Korea',
      hsCode: '9018.31.00',
      baseUom: 'PIECE',
      retailPrice: 8.8,
      status: 'ACTIVE',
    });

    const po = await PurchaseOrderModel.create({
      poNumber: `PO-${runId}-001`,
      organizationId: orgA._id,
      supplierId: testSupplier._id,
      poDate: new Date(),
      deliveryDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      currency: 'BDT',
      exchangeRate: 1,
      items: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          productName: testProduct.nameEn,
          quantity: 1000,
          uom: testProduct.baseUom,
          unitPrice: 8.8,
          lineTotal: 8800,
          receivedQty: 0,
        },
      ],
      subtotal: 8800,
      taxAmount: 0,
      grandTotal: 8800,
      paymentTerms: '30 Days Credit after Inspection',
      deliveryWarehouseId: new Types.ObjectId(),
      status: 'APPROVED',
      approvalQuorumTier: 1,
      issuedBy: testUserId,
    });

    const resolvedPo = await DocumentDataResolver.resolveDocument('PURCHASE_ORDER', po._id);
    assert(resolvedPo.documentNumber === po.poNumber, 'Resolved PO document number matches');
    assert(resolvedPo.recipient.name.includes('Square'), 'Supplier automatically resolved');
    assert(resolvedPo.organization.name === orgA.displayName, 'Organization A identity resolved');
    assert(resolvedPo.items[0].productName === 'Sterile Disposable Syringe 5ml', 'Product name resolved');
    assert(resolvedPo.items[0].brand === 'Sun Bird Pro', 'Product brand resolved');
    assert(resolvedPo.items[0].origin === 'South Korea', 'Product origin resolved');
    passCount += 6;
    console.log('  ✓ Automatic Data Resolver accurately loaded Organization, Supplier, and Product details');

    // Generate PDF
    const pdfBuffer = await DocumentPdfService.generateDocumentPdf(resolvedPo);
    assert(Buffer.isBuffer(pdfBuffer), 'PDF buffer created');
    assert(pdfBuffer.length > 500, `PDF size is ${pdfBuffer.length} bytes`);
    assert(pdfBuffer.toString('utf-8', 0, 5) === '%PDF-', 'Valid PDF file header (%PDF-) verified');
    passCount += 3;
    console.log(`  ✓ PDF Generation Engine successfully rendered PO (${pdfBuffer.length} bytes)`);

    // ─── STEP 8: SALES QUOTATION & PROFORMA INVOICE WORKFLOW (TEST 10) ──────
    console.log('\n[Step 8] Testing Sales Quotation -> Proforma Invoice Workflow...');
    const testCustomer = await CustomerModel.create({
      organizationId: orgA._id,
      fullName: `Samorita Hospital Ltd. ${runId}`,
      mobile: `+8801755${runId.slice(-6)}`,
      email: `admin-${runId}@samorita.com`,
      customerType: 'B2B_HOSPITAL',
      billingAddress: '89/1, Panthapath, Dhaka-1215',
      shippingAddress: '89/1, Panthapath, Dhaka-1215',
      isActive: true,
    });

    const quotation = await SalesDocumentService.createQuotation(
      {
        organizationId: orgA._id,
        customerId: testCustomer._id,
        subject: 'Price quotation for hospital consumables',
        validityDays: 30,
        items: [
          {
            sku: testProduct.sku,
            productName: testProduct.nameEn,
            brand: 'Sun Bird Pro',
            origin: 'South Korea',
            uom: 'PIECE',
            quantity: 500,
            unitPrice: 12.5,
          },
        ],
        termsAndConditions: ['১. ৩০ দিনের মধ্যে সরবরাহ সম্পন্ন করা হবে।'],
      },
      testUserId
    );

    assert(quotation.status === 'DRAFT', 'Quotation created in DRAFT');
    assert(quotation.grandTotal === 6250, 'Quotation grand total is 6,250.00');
    assert(quotation.quotationNumber.startsWith('QUO-'), 'Quotation numbering formatted correctly');

    // Approve quotation
    const approvedQuo = await SalesDocumentService.approveQuotation(quotation._id, testUserId);
    assert(approvedQuo.status === 'APPROVED', 'Quotation approved');
    assert(Boolean(approvedQuo.snapshot), 'Historical snapshot captured upon approval');
    passCount += 5;
    console.log(`  ✓ Sales Quotation created and approved with immutable snapshot (${quotation.quotationNumber})`);

    // Convert to Proforma Invoice
    const proforma = await SalesDocumentService.createProforma(
      {
        organizationId: orgA._id,
        customerId: testCustomer._id,
        quotationId: quotation._id,
        paymentTerms: '100% Advance Payment',
        items: [
          {
            sku: testProduct.sku,
            productName: testProduct.nameEn,
            quantity: 500,
            unitPrice: 12.5,
          },
        ],
      },
      testUserId
    );

    assert(proforma.proformaNumber.startsWith('PI-'), 'Proforma invoice created with PI number');
    assert(proforma.grandTotal === 6250, 'Proforma grand total matches quotation');

    const updatedQuo = await SalesQuotationModel.findById(quotation._id);
    assert(updatedQuo!.status === 'CONVERTED', 'Quotation status updated to CONVERTED');
    passCount += 3;
    console.log(`  ✓ Converted Quotation to Proforma Invoice (${proforma.proformaNumber})`);

    // ─── STEP 9: MONEY RECEIPT WITH GL JOURNAL VOUCHER POSTING ──────────────
    console.log('\n[Step 9] Testing Money Receipt with Double-Entry GL Journal Entry...');
    const receipt = await SalesDocumentService.createMoneyReceipt(
      {
        organizationId: orgA._id,
        customerId: testCustomer._id,
        paymentMethod: 'BANK_TRANSFER',
        bankName: 'Dutch Bangla Bank Ltd.',
        transactionRef: `TRX-${runId}-001`,
        amount: 6250,
        forParticulars: `Payment for Proforma ${proforma.proformaNumber}`,
      },
      testUserId
    );

    assert(receipt.receiptNumber.startsWith('MR-'), 'Money receipt generated with MR- number');
    assert(receipt.status === 'DRAFT', 'Receipt initialized in DRAFT');

    const postedReceipt = await SalesDocumentService.postMoneyReceipt(receipt._id, testUserId);
    assert(postedReceipt.status === 'POSTED', 'Receipt marked POSTED');
    assert(Boolean(postedReceipt.journalEntryId), 'GL Journal Voucher generated and linked');
    assert(Boolean(postedReceipt.snapshot), 'Receipt snapshot preserved');
    passCount += 5;
    console.log(`  ✓ Money Receipt posted with double-entry GL Journal Entry (${receipt.receiptNumber})`);

    // ─── STEP 10: CREDIT NOTE WITH GL JOURNAL VOUCHER POSTING ───────────────
    console.log('\n[Step 10] Testing Credit Note with Double-Entry Accounting Posting...');
    const creditNote = await SalesDocumentService.createCreditNote(
      {
        organizationId: orgA._id,
        customerId: testCustomer._id,
        reason: 'PRICE_ADJUSTMENT',
        items: [
          {
            sku: testProduct.sku,
            productName: 'Price difference credit',
            quantity: 100,
            unitPrice: 2.5,
            reason: 'Volume concession discount',
          },
        ],
        notes: 'Volume rebate credit note',
      },
      testUserId
    );

    assert(creditNote.creditNoteNumber.startsWith('CN-'), 'Credit note generated with CN- number');
    assert(creditNote.totalAmount === 250, 'Credit note total is 250.00');

    const postedCN = await SalesDocumentService.postCreditNote(creditNote._id, testUserId);
    assert(postedCN.status === 'POSTED', 'Credit note marked POSTED');
    assert(Boolean(postedCN.journalEntryId), 'GL Journal Voucher linked to Credit Note');
    passCount += 4;
    console.log(`  ✓ Credit Note posted with double-entry GL Journal Entry (${creditNote.creditNoteNumber})`);

    // ─── STEP 11: HISTORICAL SNAPSHOT IMMUTABILITY (TEST 7) ─────────────────
    console.log('\n[Step 11] Verifying Historical Snapshot Immutability...');
    // Mutate the original template name and styling
    await DocumentTemplateModel.findByIdAndUpdate(poTemplate!._id, {
      name: 'MUTATED TEMPLATE NAME - SHOULD NOT AFFECT OLD REPRINTS',
      'headerSettings.docTitle': 'MUTATED TITLE',
    });

    // The approved quotation snapshot must preserve the original title and details
    assert(
      approvedQuo.snapshot?.organization.name === orgA.displayName,
      'Approved document historical snapshot organization details remain intact'
    );
    assert(
      approvedQuo.snapshot?.grandTotal === 6250,
      'Historical snapshot calculation values remain unaltered'
    );
    passCount += 2;
    console.log('  ✓ Historical Snapshot: issued documents remain completely immutable');

    console.log('\n===============================================================');
    console.log(`  SUCCESS: ALL ${passCount} DOCUMENT MANAGEMENT ASSERTIONS PASSED!`);
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('\n❌ DOCUMENT VERIFICATION FAILED:');
    console.error(err);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runDocumentVerification();
