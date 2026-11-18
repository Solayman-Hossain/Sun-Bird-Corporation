import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import { ResolvedDocumentPayload } from './DocumentDataResolver';

export class DocumentPdfService {
  /**
   * Generates a high quality PDF Document stream from a resolved document payload
   */
  public static async generateDocumentPdf(payload: ResolvedDocumentPayload): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const template = payload.template;
      const size = template?.paperSize === 'A5' ? 'A5' : template?.paperSize === 'LETTER' ? 'LETTER' : 'A4';
      const layout = template?.orientation === 'LANDSCAPE' ? 'landscape' : 'portrait';

      const doc = new PDFDocument({
        size,
        layout,
        margin: 36, // 0.5 inch margins
        autoFirstPage: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      const org = payload.organization;
      const t = payload.template?.headerSettings;

      // ─── 1. HEADER ──────────────────────────────────────────────────────────
      doc.save();

      // Organization info (Left side)
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e3932').text(org.name || 'SUN BIRD CORPORATION', 36, 36);
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      if (org.legalName && org.legalName !== org.name) {
        doc.text(org.legalName);
      }
      doc.text(org.address || '');
      doc.text(`Phone: ${org.phone || ''} | Email: ${org.email || ''}`);
      if (org.bin) {
        doc.text(`BIN: ${org.bin}${org.tin ? ` | TIN: ${org.tin}` : ''}`);
      }

      // Document Title & Number (Right side)
      const docTitle = t?.docTitle || payload.documentType.replace(/_/g, ' ');
      doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e3932').text(docTitle, 300, 36, { align: 'right' });
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#c89348').text(`${payload.documentNumber}`, 300, 56, { align: 'right' });

      const dDate = payload.documentDate ? new Date(payload.documentDate).toLocaleDateString('en-GB') : '';
      doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(`Date: ${dDate}`, 300, 72, { align: 'right' });
      doc.text(`Status: ${payload.status || 'APPROVED'}`, 300, 84, { align: 'right' });

      doc.restore();

      // Horizontal divider
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(36, 105).lineTo(575, 105).stroke();

      // ─── 2. RECIPIENT SECTION ───────────────────────────────────────────────
      const r = payload.recipient;
      const recLabel = payload.template?.recipientSettings?.recipientLabel || (r?.type === 'SUPPLIER' ? 'Vendor / Supplier' : 'Recipient / Customer');

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3932').text(recLabel.toUpperCase(), 36, 115);
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(r?.name || 'Valued Partner', 36, 128);
      doc.fontSize(8).font('Helvetica').fillColor('#475569');
      if (r?.companyName && r.companyName !== r.name) {
        doc.text(r.companyName);
      }
      doc.text(r?.address || '');
      if (r?.phone || r?.email) {
        doc.text(`Contact: ${r?.phone || ''} ${r?.email ? `| ${r.email}` : ''}`);
      }
      if (r?.bin) {
        doc.text(`BIN / Tax ID: ${r.bin}`);
      }

      let yPos = 185;

      // Introduction Text
      if (template?.introductionText) {
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#334155').text(template.introductionText, 36, yPos, {
          width: 539,
          align: 'left',
        });
        yPos += 35;
      }

      // ─── 3. ITEMS TABLE ─────────────────────────────────────────────────────
      const columns = template?.tableDefinition?.columns?.filter((c) => c.visible) || [
        { id: 'sl', label: 'SL', field: 'sl', width: '35', align: 'center' },
        { id: 'item', label: 'Item Description', field: 'productName', width: '220', align: 'left' },
        { id: 'brand', label: 'Brand', field: 'brand', width: '65', align: 'center' },
        { id: 'origin', label: 'Origin', field: 'origin', width: '65', align: 'center' },
        { id: 'unit', label: 'Unit', field: 'uom', width: '45', align: 'center' },
        { id: 'qty', label: 'Qty', field: 'quantity', width: '45', align: 'right' },
        { id: 'rate', label: 'Rate (Tk)', field: 'unitPrice', width: '60', align: 'right' },
        { id: 'total', label: 'Total (Tk)', field: 'lineTotal', width: '65', align: 'right' },
      ];

      // Table Header
      doc.rect(36, yPos, 539, 20).fill('#f1f5f9');
      doc.strokeColor('#cbd5e1').lineWidth(0.5).rect(36, yPos, 539, 20).stroke();

      let xPos = 40;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3932');

      for (const col of columns) {
        const w = Number(col.width?.replace('px', '')) || 65;
        doc.text(col.label, xPos, yPos + 6, {
          width: w,
          align: (col.align as any) || 'left',
        });
        xPos += w + 2;
      }

      yPos += 20;

      // Table Rows
      doc.font('Helvetica').fontSize(8).fillColor('#0f172a');

      for (const [idx, item] of payload.items.entries()) {
        const rowHeight = 18;

        if (idx % 2 === 1) {
          doc.rect(36, yPos, 539, rowHeight).fill('#fafafa');
        }
        doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(36, yPos, 539, rowHeight).stroke();

        let rowX = 40;
        for (const col of columns) {
          const w = Number(col.width?.replace('px', '')) || 65;
          let val = item[col.field];
          if ((col as any).format === 'currency' && typeof val === 'number') {
            val = val.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else if (val === undefined || val === null) {
            val = '—';
          }

          doc.fillColor('#0f172a').text(String(val), rowX, yPos + 5, {
            width: w,
            align: (col.align as any) || 'left',
          });
          rowX += w + 2;
        }

        yPos += rowHeight;

        // Auto Page Break check
        if (yPos > 680) {
          doc.addPage();
          yPos = 40;
        }
      }

      // ─── 4. TOTALS SECTION ──────────────────────────────────────────────────
      yPos += 10;
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a');

      const totalsBoxWidth = 200;
      const totalsX = 375;

      if (payload.subtotal) {
        doc.text('Subtotal:', totalsX, yPos, { width: 90, align: 'left' });
        doc.text(`BDT ${payload.subtotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, totalsX + 95, yPos, {
          width: 100,
          align: 'right',
        });
        yPos += 14;
      }

      if (payload.discountTotal) {
        doc.text('Discount:', totalsX, yPos, { width: 90, align: 'left' });
        doc.text(`- BDT ${payload.discountTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, totalsX + 95, yPos, {
          width: 100,
          align: 'right',
        });
        yPos += 14;
      }

      if (payload.taxTotal) {
        doc.text('VAT / Tax:', totalsX, yPos, { width: 90, align: 'left' });
        doc.text(`+ BDT ${payload.taxTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`, totalsX + 95, yPos, {
          width: 100,
          align: 'right',
        });
        yPos += 14;
      }

      doc.rect(totalsX, yPos, totalsBoxWidth, 20).fill('#1e3932');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
      doc.text('Grand Total:', totalsX + 8, yPos + 5, { width: 85, align: 'left' });
      doc.text(
        `BDT ${payload.grandTotal.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`,
        totalsX + 95,
        yPos + 5,
        { width: 95, align: 'right' }
      );
      yPos += 30;

      // Amount in Words
      if (payload.amountInWordsEn) {
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3932').text('Amount in Words:', 36, yPos - 25);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#334155').text(payload.amountInWordsEn, 115, yPos - 25, {
          width: 250,
        });
      }

      // ─── 5. TERMS & CONDITIONS ──────────────────────────────────────────────
      if (payload.termsAndConditions && payload.termsAndConditions.length > 0) {
        const termsHeight = Math.min(100, payload.termsAndConditions.length * 15 + 20);
        doc.rect(36, yPos, 539, termsHeight).fill('#fafafa');
        doc.strokeColor('#cbd5e1').lineWidth(0.5).rect(36, yPos, 539, termsHeight).stroke();

        doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3932').text('TERMS & CONDITIONS (শর্তাবলী):', 44, yPos + 6);
        let tY = yPos + 18;

        doc.fontSize(7.5).font('Helvetica').fillColor('#475569');
        for (const term of payload.termsAndConditions.slice(0, 5)) {
          doc.text(term, 48, tY, { width: 515 });
          tY += 13;
        }

        yPos += termsHeight + 25;
      }

      // ─── 6. SIGNATURES & FOOTER ─────────────────────────────────────────────
      if (yPos > 680) {
        doc.addPage();
        yPos = 60;
      }

      // Left Signature
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(40, yPos + 35).lineTo(180, yPos + 35).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3932').text(org.signatoryName || 'Authorized Signatory', 40, yPos + 40);
      doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(org.signatoryDesignation || 'Procurement & Operations', 40, yPos + 50);

      // Right Signature (Vendor / Acceptance)
      doc.strokeColor('#94a3b8').lineWidth(1).moveTo(435, yPos + 35).lineTo(575, yPos + 35).stroke();
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#1e3932').text('Recipient / Vendor Acceptance', 435, yPos + 40);
      doc.fontSize(7).font('Helvetica').fillColor('#64748b').text('Authorized Seal & Signature', 435, yPos + 50);

      // Footer
      const footerText = template?.footerSettings?.footerText || `${org.name} · Official Enterprise Document Management Engine`;
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(footerText, 36, 780, {
        align: 'center',
        width: 539,
      });

      doc.end();
    });
  }
}

export default DocumentPdfService;
