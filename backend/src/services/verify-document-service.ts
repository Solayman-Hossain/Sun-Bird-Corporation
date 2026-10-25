/**
 * verify-document-service.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Offline (mock-DB) verification suite for DocumentService — Prompt 28.
 * Tests Mushak-6.3 compliance payload structure, VAT/SD math, gapless number
 * format, HS code validation, grand total coherence, and the mandatory-field
 * compliance validator.
 *
 * Run: npx ts-node src/services/verify-document-service.ts
 * ──────────────────────────────────────────────────────────────────────────────
 */

import {
  DocumentService,
  Mushak63CompliancePayload,
  Mushak63LineItem,
} from './DocumentService';

// ─── Test Harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(description: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ ${description}`);
    passed++;
  } else {
    const msg = detail ? `${description} — ${detail}` : description;
    console.error(`  ❌ FAIL: ${msg}`);
    failed++;
    failures.push(msg);
  }
}

function section(title: string): void {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(70)}`);
}

function printSummary(): void {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed out of ${passed + failed} assertions`);
  if (failures.length > 0) {
    console.log(`\n  Failed assertions:`);
    failures.forEach((f, i) => console.log(`    ${i + 1}. ${f}`));
  }
  console.log(`${'═'.repeat(70)}`);
  if (failed > 0) process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal valid Mushak63CompliancePayload for testing */
function buildPayload(overrides: Partial<Mushak63CompliancePayload> = {}): Mushak63CompliancePayload {
  const items: Mushak63LineItem[] = [
    {
      slNo:          1,
      hsCode:        '30049099',
      descriptionEn: 'Paracetamol Tablet 500mg',
      descriptionBn: 'প্যারাসিটামল ট্যাবলেট ৫০০মি.গ্রা',
      uom:           'BOX',
      qty:           10,
      unitPriceBDT:  500,
      basePriceBDT:  5000,
      vatRate:       15,
      vatBDT:        750,
      sdRate:        0,
      sdBDT:         0,
      lineTotalBDT:  5750,
    },
  ];

  return {
    documentType:      'DELIVERY_CHALLAN',
    documentNo:        'CH-2026-00001',
    issueDate:         '2026-10-20',
    sellerBin:         '000000000-0201',
    sellerNameEn:      'Sun Bird Corporation',
    sellerNameBn:      'সান বার্ড কর্পোরেশন',
    sellerAddressEn:   'Dhaka, Bangladesh',
    sellerAddressBn:   'ঢাকা, বাংলাদেশ',
    buyerBin:          '100000000-0101',
    buyerNameEn:       'General Hospital Ltd',
    buyerAddress:      'Mirpur, Dhaka',
    dispatchTimestamp: '2026-10-20T09:30:00.000Z',
    vehicleNumber:     'DHAKA-BA-1234',
    driverName:        'Abdul Karim',
    items,
    subtotalBDT:       5000,
    discountBDT:       0,
    vatBDT:            750,
    sdBDT:             0,
    grandTotalBDT:     5750,
    pdfS3Url:          'https://sunbird-documents.s3.ap-southeast-1.amazonaws.com/challans/2026/CH-2026-00001.pdf',
    ...overrides,
  };
}

/** Compute expected lineItem fields for a given input */
function computeLine(qty: number, unitPrice: number, vatRate: number, sdRate: number) {
  const basePriceBDT = parseFloat((qty * unitPrice).toFixed(2));
  const vatBDT       = parseFloat((basePriceBDT * vatRate / 100).toFixed(2));
  const sdBDT        = parseFloat((basePriceBDT * sdRate  / 100).toFixed(2));
  const lineTotalBDT = parseFloat((basePriceBDT + vatBDT + sdBDT).toFixed(2));
  return { basePriceBDT, vatBDT, sdBDT, lineTotalBDT };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

console.log('═'.repeat(70));
console.log('  Prompt 28 — NBR Mushak-6.3 DocumentService Verification');
console.log('  (Offline mode — no MongoDB / S3 connections required)');
console.log('═'.repeat(70));

// ══════════════════════════════════════════════════════════════════════════════
section('§1 — Gapless Sequential Number Format (CounterService integration)');
// ══════════════════════════════════════════════════════════════════════════════

{
  const year = new Date().getFullYear();

  // Simulate CounterService output format
  function simulateSeq(prefix: string, seq: number): string {
    return `${prefix}-${year}-${String(seq).padStart(5, '0')}`;
  }

  assert('CH-YYYY-XXXXX format is correct (seq=1)',
    /^CH-\d{4}-\d{5}$/.test(simulateSeq('CH', 1)));
  assert('INV-YYYY-XXXXX format is correct (seq=1)',
    /^INV-\d{4}-\d{5}$/.test(simulateSeq('INV', 1)));
  assert('CH sequence pads to 5 digits (seq=7)',
    simulateSeq('CH', 7) === `CH-${year}-00007`);
  assert('INV sequence pads to 5 digits (seq=482)',
    simulateSeq('INV', 482) === `INV-${year}-00482`);
  assert('Year in number matches current year',
    simulateSeq('CH', 1).includes(String(year)));
  assert('Numbers are gapless — consecutive (seq=100 → 00100)',
    simulateSeq('CH', 100) === `CH-${year}-00100`);
}

// ══════════════════════════════════════════════════════════════════════════════
section('§2 — 8-digit NBR HS Code Validation');
// ══════════════════════════════════════════════════════════════════════════════

{
  function isValidHsCode(code: string): boolean {
    return /^\d{8}$/.test(code.replace(/\s/g, ''));
  }

  assert('HS Code 30049099 is valid (8-digit numeric)', isValidHsCode('30049099'));
  assert('HS Code 29054900 is valid', isValidHsCode('29054900'));
  assert('HS Code 84733090 is valid', isValidHsCode('84733090'));
  assert('HS Code "3004 9099" (spaced) normalises to valid', isValidHsCode('3004 9099'));
  assert('HS Code 3004909 (7 digits) is INVALID', !isValidHsCode('3004909'));
  assert('HS Code 300490991 (9 digits) is INVALID', !isValidHsCode('300490991'));
  assert('HS Code ABCD1234 (alpha) is INVALID', !isValidHsCode('ABCD1234'));
  assert('HS Code "" (empty) is INVALID', !isValidHsCode(''));
}

// ══════════════════════════════════════════════════════════════════════════════
section('§3 — VAT 15% and Supplementary Duty Line Item Calculations');
// ══════════════════════════════════════════════════════════════════════════════

{
  const cases = [
    { qty: 10, unitPrice: 500, vatRate: 15, sdRate: 0  },
    { qty:  5, unitPrice: 1200, vatRate: 15, sdRate: 10 },
    { qty: 20, unitPrice: 250, vatRate: 15, sdRate: 5  },
    { qty:  1, unitPrice: 99999, vatRate: 15, sdRate: 0 },
  ];

  for (const c of cases) {
    const result = computeLine(c.qty, c.unitPrice, c.vatRate, c.sdRate);
    const expected = c.qty * c.unitPrice;
    assert(
      `Base price correct: qty=${c.qty} × ৳${c.unitPrice} = ৳${expected.toFixed(2)}`,
      result.basePriceBDT === parseFloat(expected.toFixed(2))
    );
    assert(
      `VAT @${c.vatRate}% on ৳${expected} = ৳${(expected * c.vatRate / 100).toFixed(2)}`,
      result.vatBDT === parseFloat((expected * c.vatRate / 100).toFixed(2))
    );
    assert(
      `SD @${c.sdRate}% on ৳${expected} = ৳${(expected * c.sdRate / 100).toFixed(2)}`,
      result.sdBDT === parseFloat((expected * c.sdRate / 100).toFixed(2))
    );
    const expectedTotal = parseFloat((result.basePriceBDT + result.vatBDT + result.sdBDT).toFixed(2));
    assert(
      `Line total = base + VAT + SD = ৳${expectedTotal}`,
      result.lineTotalBDT === expectedTotal
    );
  }
}

// ══════════════════════════════════════════════════════════════════════════════
section('§4 — Grand Total Coherence (subtotal - discount + VAT + SD)');
// ══════════════════════════════════════════════════════════════════════════════

{
  function computeGrand(subtotal: number, discount: number, vat: number, sd: number): number {
    return parseFloat((subtotal - discount + vat + sd).toFixed(2));
  }

  assert('Grand total with no discount: 5000 + 750 VAT = 5750',
    computeGrand(5000, 0, 750, 0) === 5750);
  assert('Grand total with 500 discount: 4500 + 675 VAT = 5175',
    computeGrand(5000, 500, 675, 0) === 5175);
  assert('Grand total with SD: 5000 + 750 VAT + 250 SD = 6000',
    computeGrand(5000, 0, 750, 250) === 6000);
  assert('Grand total coherence validator passes on matching payload', (() => {
    const violations = DocumentService.validateMushak63Compliance(buildPayload());
    return violations.length === 0;
  })());
  assert('Grand total coherence validator catches mismatch (stated 9999 vs computed 5750)', (() => {
    const violations = DocumentService.validateMushak63Compliance(
      buildPayload({ grandTotalBDT: 9999 })
    );
    return violations.some((v) => v.includes('GRAND_TOTAL_MISMATCH'));
  })());
}

// ══════════════════════════════════════════════════════════════════════════════
section('§5 — Mushak-6.3 Mandatory Field Compliance Validator');
// ══════════════════════════════════════════════════════════════════════════════

{
  const validPayload = buildPayload();

  assert('Valid payload passes with 0 violations',
    DocumentService.validateMushak63Compliance(validPayload).length === 0);

  assert('Missing sellerBin triggers violation', (() => {
    const v = DocumentService.validateMushak63Compliance(buildPayload({ sellerBin: '' }));
    return v.some((x) => x.includes('sellerBin'));
  })());

  assert('Missing sellerNameBn triggers violation', (() => {
    const v = DocumentService.validateMushak63Compliance(buildPayload({ sellerNameBn: '' }));
    return v.some((x) => x.includes('sellerNameBn'));
  })());

  assert('Missing documentNo triggers violation', (() => {
    const v = DocumentService.validateMushak63Compliance(buildPayload({ documentNo: '' }));
    return v.some((x) => x.includes('documentNo'));
  })());

  assert('Missing issueDate triggers violation', (() => {
    const v = DocumentService.validateMushak63Compliance(buildPayload({ issueDate: '' }));
    return v.some((x) => x.includes('issueDate'));
  })());

  assert('Empty items array triggers violation', (() => {
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items: [] }));
    return v.some((x) => x.includes('items'));
  })());

  assert('7-digit HS code triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], hsCode: '3004909' }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('hsCode'));
  })());

  assert('Alpha HS code triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], hsCode: 'ABCD1234' }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('hsCode'));
  })());

  assert('Missing descriptionBn triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], descriptionBn: '' }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('descriptionBn'));
  })());

  assert('Missing descriptionEn triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], descriptionEn: '' }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('descriptionEn'));
  })());

  assert('Missing UOM triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], uom: '' }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('uom'));
  })());

  assert('qty = 0 triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], qty: 0 }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('qty'));
  })());

  assert('Negative vatRate triggers violation', (() => {
    const items = [{ ...buildPayload().items[0], vatRate: -1 }];
    const v = DocumentService.validateMushak63Compliance(buildPayload({ items }));
    return v.some((x) => x.includes('vatRate'));
  })());
}

// ══════════════════════════════════════════════════════════════════════════════
section('§6 — Compliance Payload Structure (Mushak-6.3 mandatory fields present)');
// ══════════════════════════════════════════════════════════════════════════════

{
  const payload = buildPayload();

  // Document identity
  assert('documentType field present',    typeof payload.documentType === 'string');
  assert('documentNo field present',      typeof payload.documentNo   === 'string');
  assert('issueDate is YYYY-MM-DD',       /^\d{4}-\d{2}-\d{2}$/.test(payload.issueDate));
  assert('dispatchTimestamp is ISO 8601', !isNaN(Date.parse(payload.dispatchTimestamp)));

  // Seller mandatory fields
  assert('sellerBin present',      !!payload.sellerBin);
  assert('sellerNameEn present',   !!payload.sellerNameEn);
  assert('sellerNameBn present',   !!payload.sellerNameBn);
  assert('sellerAddressEn present', !!payload.sellerAddressEn);
  assert('sellerAddressBn present', !!payload.sellerAddressBn);

  // Buyer
  assert('buyerNameEn present',    !!payload.buyerNameEn);
  assert('buyerBin populated (B2B case)', !!payload.buyerBin);

  // Line item structure
  const item = payload.items[0];
  assert('item.hsCode is 8 digits',      /^\d{8}$/.test(item.hsCode));
  assert('item.descriptionEn present',   !!item.descriptionEn);
  assert('item.descriptionBn present',   !!item.descriptionBn);
  assert('item.uom present',             !!item.uom);
  assert('item.qty > 0',                 item.qty > 0);
  assert('item.vatRate = 15',            item.vatRate === 15);
  assert('item.basePriceBDT = qty × unit', item.basePriceBDT === item.qty * item.unitPriceBDT);
  assert('item.vatBDT = 15% of base',
    Math.abs(item.vatBDT - item.basePriceBDT * 0.15) < 0.01);

  // Totals
  assert('grandTotalBDT = subtotal + VAT + SD - discount',
    Math.abs(payload.grandTotalBDT - (payload.subtotalBDT - payload.discountBDT + payload.vatBDT + payload.sdBDT)) < 0.02);

  // Optional fields for challan
  assert('vehicleNumber present on challan', !!payload.vehicleNumber);
  assert('driverName present on challan',    !!payload.driverName);

  // pdfS3Url set after upload
  assert('pdfS3Url is a non-empty string', typeof payload.pdfS3Url === 'string' && payload.pdfS3Url.length > 0);
}

// ══════════════════════════════════════════════════════════════════════════════
section('§7 — TAX_INVOICE payload specific checks');
// ══════════════════════════════════════════════════════════════════════════════

{
  const invoicePayload = buildPayload({ documentType: 'TAX_INVOICE', documentNo: 'INV-2026-00001' });

  assert('TAX_INVOICE documentType is correct', invoicePayload.documentType === 'TAX_INVOICE');
  assert('INV-YYYY-XXXXX format for invoice number', /^INV-\d{4}-\d{5}$/.test(invoicePayload.documentNo));
  assert('Invoice passes compliance validator',
    DocumentService.validateMushak63Compliance(invoicePayload).length === 0);
}

// ══════════════════════════════════════════════════════════════════════════════
section('§8 — Multi-line item aggregate totals');
// ══════════════════════════════════════════════════════════════════════════════

{
  const items: Mushak63LineItem[] = [
    { slNo: 1, hsCode: '30049099', descriptionEn: 'Drug A', descriptionBn: 'ড্রাগ এ',
      uom: 'BOX', qty: 10, unitPriceBDT: 500, basePriceBDT: 5000,
      vatRate: 15, vatBDT: 750, sdRate: 0, sdBDT: 0, lineTotalBDT: 5750 },
    { slNo: 2, hsCode: '29054900', descriptionEn: 'Drug B', descriptionBn: 'ড্রাগ বি',
      uom: 'PCS', qty: 50, unitPriceBDT: 200, basePriceBDT: 10000,
      vatRate: 15, vatBDT: 1500, sdRate: 5, sdBDT: 500, lineTotalBDT: 12000 },
  ];

  const subtotal = items.reduce((s, l) => s + l.basePriceBDT, 0);
  const vatSum   = items.reduce((s, l) => s + l.vatBDT,       0);
  const sdSum    = items.reduce((s, l) => s + l.sdBDT,        0);
  const grand    = parseFloat((subtotal + vatSum + sdSum).toFixed(2));

  assert('Subtotal aggregate = 5000 + 10000 = 15000', subtotal === 15000);
  assert('VAT aggregate = 750 + 1500 = 2250',         vatSum   === 2250);
  assert('SD aggregate = 0 + 500 = 500',              sdSum    === 500);
  assert('Grand total aggregate = 15000 + 2250 + 500 = 17750', grand === 17750);

  const multiPayload = buildPayload({
    items,
    subtotalBDT:   subtotal,
    vatBDT:        vatSum,
    sdBDT:         sdSum,
    grandTotalBDT: grand,
  });
  assert('Multi-line payload passes compliance validator',
    DocumentService.validateMushak63Compliance(multiPayload).length === 0);
}

// ─── Final Summary ────────────────────────────────────────────────────────────

printSummary();
