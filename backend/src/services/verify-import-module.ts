import mongoose, { Types } from 'mongoose';
import env from '../config/env';
import { ImportLCModel } from '../models/ImportLC';
import { ProformaInvoiceModel } from '../models/ProformaInvoice';
import { LCAmendmentModel } from '../models/LCAmendment';
import { ImportShipmentModel } from '../models/ImportShipment';
import { CustomsClearanceModel } from '../models/CustomsClearance';
import { ImportPaymentModel } from '../models/ImportPayment';
import { ImportDocumentModel } from '../models/ImportDocument';
import { SupplierModel } from '../models/Supplier';
import { OrganizationModel } from '../models/Organization';
import { UserModel } from '../models/User';
import { ProductModel } from '../models/Product';
import { ImportLcService } from './ImportLcService';
import { ImportShipmentService } from './ImportShipmentService';
import { ImportFinanceService } from './ImportFinanceService';
import { ImportDocumentService } from './ImportDocumentService';
import { ImportAnalyticsService } from './ImportAnalyticsService';
import { ImportAiService } from './ImportAiService';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${testName}${detail ? ` - ${detail}` : ''}`);
  } else {
    console.error(`❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
}

async function runImportModuleVerification() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  MODULE 12: IMPORT / LC TRACKER & AI MANAGEMENT TEST SUITE');
  console.log('  Sun Bird Corporation ERP Enterprise Verification');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  await mongoose.connect(env.MONGODB_URI);

  try {
    // 0. Resolve or create test fixtures (Org, Supplier, User)
    let org = await OrganizationModel.findOne();
    if (!org) {
      org = await OrganizationModel.create({
        legalName: 'Sun Bird Corporation Ltd.',
        displayName: 'Sun Bird Corporation Ltd.',
        organizationCode: 'SBC-MAIN',
        organizationType: 'PARENT',
        isActive: true,
      });
    }

    let supplier = await SupplierModel.findOne();
    if (!supplier) {
      supplier = await SupplierModel.create({
        companyName: 'BMC Medical Co., Ltd. (Taiwan)',
        code: 'SUP-BMC-001',
        country: 'Taiwan',
        email: 'export@bmc-medical.tw',
        phone: '+886-2-2345-6789',
        isActive: true,
      });
    }

    let user = await UserModel.findOne();
    if (!user) {
      user = await UserModel.create({
        name: 'Import Manager',
        email: 'import.manager@sunbird.com.bd',
        passwordHash: 'dummyhash',
        role: 'admin',
      });
    }

    const testTimestamp = Date.now();

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 1: Import LC Creation with Extended Organization & Expiry Data
    // ──────────────────────────────────────────────────────────────────────────
    console.log('--- 1. Import LC Creation & Lifecycle Initialization ---');
    const lcNumber = `LC-TEST-${testTimestamp}`;
    const lc = await ImportLcService.createImportLc({
      lcNumber,
      supplierId: supplier._id,
      issuingBank: 'City Bank Ltd. (Banani Branch)',
      foreignCurrency: 'USD',
      lcValueFC: 48500,
      openingExchangeRate: 120.5,
      portFreeDays: 4,
      demurrageDailyRateBDT: 5000,
    });

    lc.organizationId = org._id;
    lc.applicantOrganization = org.displayName || org.legalName;
    lc.lcMarginPercentage = 15;
    lc.lcMarginAmountBDT = 48500 * 120.5 * 0.15;
    lc.lcOpeningDate = new Date();
    lc.lcExpiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    lc.latestShipmentDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    lc.portOfLoading = 'Keelung Port, Taiwan';
    lc.portOfDischarge = 'Chittagong Port';
    lc.incoterms = 'CFR';
    lc.paymentTerms = '100% L/C at Sight';
    await lc.save();

    assert(Boolean(lc._id), 'Import LC created with atomic sequence', `LC: ${lc.lcNumber} ($${lc.lcValueFC} @ ৳${lc.openingExchangeRate})`);
    assert(lc.version === 'V1', 'LC initial version is V1');
    assert(lc.status === 'LC_OPENED', 'LC initial status is LC_OPENED');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 2: Proforma Invoice (PI) Management & Calculation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 2. Proforma Invoice (PI) Creation & Verification ---');
    const piNumber = `PI-TEST-${testTimestamp}`;
    const pi = await ImportFinanceService.createProformaInvoice(
      {
        piNumber,
        organizationId: org._id,
        supplierId: supplier._id,
        currency: 'USD',
        items: [
          {
            productName: '10L Medical Oxygen Concentrator',
            sku: 'MOC-10L',
            hsCode: '9019.20.00',
            quantity: 50,
            unit: 'UNITS',
            unitPriceFC: 450,
          },
          {
            productName: 'Multi-parameter Patient Monitor',
            sku: 'MPM-V8',
            hsCode: '9018.19.00',
            quantity: 40,
            unit: 'SETS',
            unitPriceFC: 650,
          },
        ],
        freightFC: 1500,
        insuranceFC: 500,
        portOfLoading: 'Keelung',
        portOfDischarge: 'Chittagong Port',
      },
      user._id
    );

    assert(Boolean(pi._id), 'Proforma Invoice registered', `PI: ${pi.piNumber} (Grand Total: $${pi.grandTotalFC})`);
    assert(pi.grandTotalFC === 50 * 450 + 40 * 650 + 1500 + 500, 'PI grand total accurately aggregates items, freight, insurance');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 3: LC Amendment Management with Immutable History Tracking
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 3. LC Amendment Management & Version Progression ---');
    const amendment = await ImportFinanceService.createLCAmendment(
      {
        lcId: lc._id,
        organizationId: org._id,
        revisedAmountFC: 52000,
        revisedExpiryDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
        changedClauses: 'Extended expiry by 30 days and increased value by $3,500 for additional accessories',
        reason: 'Hospital client requested extra pulse oximeter probes',
        amendmentChargesBDT: 6500,
        bankConfirmationRef: 'CB-AMD-2026-904',
      },
      user._id
    );

    const reloadedLc = await ImportLCModel.findById(lc._id);
    assert(Boolean(amendment._id), 'LC Amendment recorded', `Code: ${amendment.amendmentCode}`);
    assert(reloadedLc?.version === 'V2', 'LC version successfully progressed to V2');
    assert(reloadedLc?.lcValueFC === 52000, 'LC value updated to 52,000 USD');
    assert(reloadedLc?.status === 'AMENDED', 'LC status transitioned to AMENDED');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 4: Shipment Management & AI Delay Risk Prediction
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 4. Import Shipment Registration & Tracking Events ---');
    const shipment = await ImportShipmentService.createShipment(
      {
        lcId: lc._id,
        organizationId: org._id,
        supplierId: supplier._id,
        shipmentMode: 'SEA',
        vesselName: 'MV Bengal Express',
        voyageNumber: 'V-0491',
        containerNumbers: ['BMOU-491028-1', 'BMOU-491029-7'],
        blOrAwbNumber: `BL-TEST-${testTimestamp}`,
        portOfLoading: 'Keelung, Taiwan',
        portOfDischarge: 'Chittagong Sea Port',
        etd: new Date(),
        eta: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        shipmentQuantity: 90,
        shipmentValueFC: 52000,
        commercialInvoice: {
          invoiceNumber: `CI-TEST-${testTimestamp}`,
          invoiceDate: new Date(),
          totalAmountFC: 52000,
          currency: 'USD',
        },
        packingList: {
          packingListNumber: `PL-TEST-${testTimestamp}`,
          totalPackages: 90,
          grossWeightKg: 2850,
          netWeightKg: 2400,
        },
      },
      user._id
    );

    assert(Boolean(shipment._id), 'Import Shipment created with sequence ref', `Ref: ${shipment.shipmentReference}`);
    assert(shipment.containerNumbers.length === 2, 'Container numbers properly mapped');

    // Add tracking event
    const updatedShipment = await ImportShipmentService.addTrackingEvent(
      {
        shipmentId: shipment._id,
        location: 'Singapore Anchorage Port',
        status: 'TRANSSHIPMENT_HUB',
        description: 'Feeder vessel transshipment completed; departing for Chittagong Port',
      },
      user._id
    );
    assert(updatedShipment.trackingEvents.length >= 2, 'Tracking checkpoint event registered');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 5: Port Customs Clearance & Bill of Entry Management
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 5. Customs Clearance, Duties & Demurrage Recording ---');
    const clearance = await ImportShipmentService.recordCustomsClearance(
      {
        billOfEntryNumber: `BE-TEST-${testTimestamp}`,
        billOfEntryDate: new Date(),
        organizationId: org._id,
        lcId: lc._id,
        shipmentId: shipment._id,
        customsHouse: 'Chittagong Custom House',
        cfAgentName: 'Bengal Shipping & Clearing Agency',
        hsCodes: ['9019.20.00', '9018.19.00'],
        assessableValueBDT: 6240000,
        customsDutyBDT: 624000,
        regulatoryDutyBDT: 187200,
        vatBDT: 936000,
        advanceTaxBDT: 312000,
        advanceIncomeTaxBDT: 312000,
        portChargesBDT: 85000,
        cfAgentChargesBDT: 45000,
        demurrageChargesBDT: 0,
      },
      user._id
    );

    assert(Boolean(clearance._id), 'Customs Bill of Entry recorded', `B/E: ${clearance.billOfEntryNumber}`);
    assert(clearance.totalDutyAndTaxesBDT > 0, 'Total statutory duty & VAT calculated', `Total Duty: ৳${clearance.totalDutyAndTaxesBDT.toLocaleString()}`);

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 6: Import Payment & LC Margin with Double-Entry Posting
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 6. Import Payment & Double-Entry Accounting Posting ---');
    const payment = await ImportFinanceService.recordImportPayment(
      {
        organizationId: org._id,
        lcId: lc._id,
        bankName: 'City Bank Ltd.',
        paymentType: 'LC_MARGIN',
        foreignAmount: 7800,
        exchangeRate: 120.5,
        transactionReference: `TXN-CB-${testTimestamp}`,
      },
      user._id
    );

    assert(Boolean(payment._id), 'Import payment recorded', `Ref: ${payment.paymentReference} (৳${payment.localAmountBDT.toLocaleString()})`);
    assert(payment.paymentType === 'LC_MARGIN', 'Payment type matches LC_MARGIN');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 7: Centralized Document Repository & AI OCR Extraction
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 7. Import Document Repository & AI Extraction ---');
    const doc = await ImportDocumentService.registerDocument(
      {
        documentType: 'BILL_OF_LADING',
        title: 'Original Ocean Bill of Lading (3/3 Non-Negotiable)',
        organizationId: org._id,
        lcId: lc._id,
        shipmentId: shipment._id,
        fileUrl: '/uploads/import/bl-sample.pdf',
        fileName: 'bl-sample.pdf',
        fileSize: 458920,
      },
      user._id,
      true
    );

    assert(Boolean(doc._id), 'Import document registered in repository', `Title: ${doc.title}`);
    assert(Boolean(doc.aiExtraction), 'AI OCR Extraction generated metadata');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 8: AI Document Comparison (Discrepancy Detection)
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 8. AI Document Cross-Validation & Discrepancy Detection ---');
    const { comparison } = await ImportAiService.compareDocuments(
      {
        type: 'PROFORMA_INVOICE',
        reference: pi.piNumber || pi.proformaNumber,
        totalAmount: 50500,
        currency: 'USD',
        items: [{ sku: 'MOC-10L', quantity: 50 }],
      },
      {
        type: 'COMMERCIAL_INVOICE',
        reference: `CI-${testTimestamp}`,
        totalAmount: 52000,
        currency: 'USD',
        items: [{ sku: 'MOC-10L', quantity: 50 }],
      }
    );

    assert(comparison.matchScore >= 40, 'AI cross-document comparison computed match score', `Score: ${comparison.matchScore}%`);
    assert(comparison.discrepancies.length > 0, 'AI successfully detected discrepancy in grand total');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 9: AI Landed Cost Analysis & Allocation Heuristics
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 9. AI Landed Cost Heuristics & Advice ---');
    const { advice } = await ImportAiService.analyzeLandedCost(
      {
        customsDuty: 624000,
        vatAmount: 936000,
        cfAgentCharges: 45000,
        portDemurragePenalty: 0,
      },
      2,
      6240000
    );

    assert(advice.recommendedAllocationMethod === 'BY_VALUE', 'AI recommended BY_VALUE allocation method for clinical equipment');
    assert(advice.potentialCostSavings.length > 0, 'AI generated actionable landed cost optimization tips');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 10: Import Dashboard Real-Data Aggregation
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 10. Real-Data Import Dashboard KPIs & Metrics ---');
    const kpis = await ImportAnalyticsService.getDashboardMetrics(org._id);

    assert(kpis.totalActiveLcs >= 1, 'Dashboard KPIs aggregates active LCs count', `Active LCs: ${kpis.totalActiveLcs}`);
    assert(kpis.totalLcValueFC > 0, 'Dashboard KPIs calculates aggregate LC value in foreign currency', `Total FC: $${kpis.totalLcValueFC.toLocaleString()}`);
    assert(kpis.totalShipmentsCount >= 1, 'Dashboard KPIs tracks registered shipments', `Shipments: ${kpis.totalShipmentsCount}`);

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 11: Contextual Natural Language Import AI Assistant
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 11. Contextual Import AI Assistant Natural Language Query ---');
    const aiResponse = await ImportAiService.answerImportQuery(
      'Which LCs will expire soon and what are the outstanding shipments?',
      {
        activeLcsCount: kpis.totalActiveLcs,
        totalLcValueFC: kpis.totalLcValueFC,
        currency: 'USD',
        inTransitShipmentsCount: kpis.shipmentsInTransit,
        delayedShipmentsCount: kpis.delayedShipments,
        pendingCustomsCount: kpis.customsClearancePending,
        upcomingExpiringLcs: [lc.lcNumber],
        outstandingPaymentsBDT: kpis.outstandingPaymentsBDT,
      }
    );

    assert(aiResponse.answer.length > 20, 'Import AI Assistant returned comprehensive natural-language response', `Source: ${aiResponse.generatedBy}`);
    assert(aiResponse.suggestedActions?.length! > 0, 'AI Assistant provided actionable follow-ups');

    // ──────────────────────────────────────────────────────────────────────────
    // SUITE 12: MIS Reports Generation with AI Summary
    // ──────────────────────────────────────────────────────────────────────────
    console.log('\n--- 12. MIS Report Generation with AI Executive Summary ---');
    const report = await ImportAnalyticsService.generateImportReport('LC_REGISTER', org._id);
    assert(report.data.length >= 1, 'MIS Report returned real records from database');
    assert(report.summary.length > 20, 'MIS Report included AI-generated executive narrative');

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  MODULE 12 TEST SUMMARY: ALL ${passedTests}/${totalTests} TEST SUITES PASSED | 0 FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');
  } catch (err: any) {
    console.error('Fatal error during Module 12 verification:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runImportModuleVerification();
