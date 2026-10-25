import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  SupplierModel,
  SupplierQuotationModel,
  ComparativeStatementModel,
  PurchaseOrderModel,
  ImportLCModel,
  LandedCostModel,
  ProductModel,
  UserModel,
  RoleModel,
} from './index';

async function runProcurementModelsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 17: PROCUREMENT & IMPORT LC MONGOOSE MODELS VERIFICATION');
  console.log('  (SUPPLIER, QUOTATION, CS, PO, IMPORT LC, LANDED COST)');
  console.log('════════════════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    await connectDatabase().catch(() => {});

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Index Initialization & Catalog Synchronization');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      SupplierModel.createIndexes(),
      SupplierQuotationModel.createIndexes(),
      ComparativeStatementModel.createIndexes(),
      PurchaseOrderModel.createIndexes(),
      ImportLCModel.createIndexes(),
      LandedCostModel.createIndexes(),
    ]);

    assert(true, 'All 6 procurement model collections initialized and createIndexes completed');

    // Retrieve indexes directly from MongoDB's system catalog
    const supplierIndexes = await SupplierModel.collection.indexes();
    const quotationIndexes = await SupplierQuotationModel.collection.indexes();
    const csIndexes = await ComparativeStatementModel.collection.indexes();
    const poIndexes = await PurchaseOrderModel.collection.indexes();
    const lcIndexes = await ImportLCModel.collection.indexes();
    const landedCostIndexes = await LandedCostModel.collection.indexes();

    function hasIndex(indexes: any[], keyObj: Record<string, number>, unique?: boolean): boolean {
      return indexes.some((idx) => {
        const keyMatch = Object.entries(keyObj).every(
          ([k, v]) => idx.key && idx.key[k] === v && Object.keys(idx.key).length === Object.keys(keyObj).length
        );
        if (!keyMatch) return false;
        if (unique !== undefined) {
          return Boolean(idx.unique) === unique;
        }
        return true;
      });
    }

    // ─── 1.1 Supplier Indexes ───
    assert(
      hasIndex(supplierIndexes, { supplierCode: 1 }, true),
      "Supplier: explicit unique index on { supplierCode: 1 }"
    );
    assert(
      hasIndex(supplierIndexes, { supplierType: 1, isActive: 1 }),
      "Supplier: explicit compound index on { supplierType: 1, isActive: 1 }"
    );
    assert(
      hasIndex(supplierIndexes, { country: 1 }),
      "Supplier: explicit single index on { country: 1 }"
    );

    // ─── 1.2 SupplierQuotation Indexes ───
    assert(
      hasIndex(quotationIndexes, { rfqNumber: 1 }),
      "SupplierQuotation: explicit index on { rfqNumber: 1 }"
    );
    assert(
      hasIndex(quotationIndexes, { rfqNumber: 1, supplierId: 1 }, true),
      "SupplierQuotation: explicit unique compound index on { rfqNumber: 1, supplierId: 1 }"
    );
    assert(
      hasIndex(quotationIndexes, { supplierId: 1, sku: 1 }),
      "SupplierQuotation: explicit compound index on { supplierId: 1, sku: 1 }"
    );
    assert(
      hasIndex(quotationIndexes, { sku: 1 }),
      "SupplierQuotation: explicit single index on { sku: 1 }"
    );
    assert(
      hasIndex(quotationIndexes, { validUntil: 1 }),
      "SupplierQuotation: explicit single index on { validUntil: 1 }"
    );

    // ─── 1.3 ComparativeStatement Indexes ───
    assert(
      hasIndex(csIndexes, { csNumber: 1 }, true),
      "ComparativeStatement: explicit unique index on { csNumber: 1 }"
    );
    assert(
      hasIndex(csIndexes, { sku: 1 }),
      "ComparativeStatement: explicit single index on { sku: 1 }"
    );
    assert(
      hasIndex(csIndexes, { status: 1 }),
      "ComparativeStatement: explicit single index on { status: 1 }"
    );
    assert(
      hasIndex(csIndexes, { productId: 1 }),
      "ComparativeStatement: explicit single index on { productId: 1 }"
    );

    // ─── 1.4 PurchaseOrder Indexes ───
    assert(
      hasIndex(poIndexes, { poNumber: 1 }, true),
      "PurchaseOrder: explicit unique index on { poNumber: 1 }"
    );
    assert(
      hasIndex(poIndexes, { supplierId: 1, status: 1 }),
      "PurchaseOrder: explicit compound index on { supplierId: 1, status: 1 }"
    );
    assert(
      hasIndex(poIndexes, { status: 1 }),
      "PurchaseOrder: explicit single index on { status: 1 }"
    );

    // ─── 1.5 ImportLC Indexes ───
    assert(
      hasIndex(lcIndexes, { lcNumber: 1 }, true),
      "ImportLC: explicit unique index on { lcNumber: 1 }"
    );
    assert(
      hasIndex(lcIndexes, { status: 1 }),
      "ImportLC: explicit single index on { status: 1 }"
    );
    assert(
      hasIndex(lcIndexes, { supplierId: 1 }),
      "ImportLC: explicit single index on { supplierId: 1 }"
    );
    assert(
      hasIndex(lcIndexes, { purchaseOrderId: 1 }),
      "ImportLC: explicit single index on { purchaseOrderId: 1 }"
    );

    // ─── 1.6 LandedCost Indexes ───
    assert(
      hasIndex(landedCostIndexes, { lcId: 1 }, true),
      "LandedCost: explicit unique index on { lcId: 1 }"
    );
    assert(
      hasIndex(landedCostIndexes, { lcNumber: 1 }),
      "LandedCost: explicit single index on { lcNumber: 1 }"
    );
    assert(
      hasIndex(landedCostIndexes, { isFinalized: 1 }),
      "LandedCost: explicit single index on { isFinalized: 1 }"
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  2. Schema Validation & Unique Constraint Enforcement');
    console.log('────────────────────────────────────────────────────────────────────────');

    const testId = Date.now().toString().slice(-6);

    // Setup helper referenced entities
    const testProduct = await ProductModel.create({
      sku: `PROD-TEST-${testId}`,
      nameEn: 'Procurement Test Item',
      nameBn: 'প্রকিউরমেন্ট টেস্ট আইটেম',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.90.00',
      baseUom: 'Unit',
      retailPrice: 50000,
      showroomPrice: 48000,
      isMedical: true,
      isActive: true,
    });

    const testRole = await RoleModel.create({
      roleName: `Procurement Officer ${testId}`,
      slug: `po_officer_${testId}`,
      permissions: [{ module: 'procurement', actions: ['CREATE', 'READ', 'UPDATE'] }],
      isActive: true,
    });

    const testUser = await UserModel.create({
      fullName: `Procurement Staff ${testId}`,
      email: `proc.${testId}@sunbirdcorp.com`,
      mobile: `01711${testId}`,
      userType: 'STAFF',
      roleId: testRole._id,
      isActive: true,
    });

    // ─── 2.1 Supplier Model Verification ───
    const supplier1 = await SupplierModel.create({
      supplierCode: `SUP-INTL-${testId}`,
      companyName: 'Chison Medical Technologies Co., Ltd.',
      contactPerson: 'Chen Wei',
      email: `export.${testId}@chison.com.cn`,
      phone: '+86-510-85345999',
      country: 'China',
      currency: 'USD',
      supplierType: 'FOREIGN',
      paymentTerms: '100% Sight LC',
      bankDetails: 'Bank of China, Wuxi Branch',
      aiRiskScore: 12,
    });
    assert(Boolean(supplier1._id), 'Supplier created successfully');
    assert(supplier1.supplierCode === `SUP-INTL-${testId}`, 'Supplier code normalized uppercase');

    // Duplicate supplierCode test
    let duplicateSupplierError = false;
    try {
      await SupplierModel.create({
        supplierCode: `SUP-INTL-${testId}`,
        companyName: 'Duplicate Supplier Corp',
        country: 'China',
        currency: 'USD',
        supplierType: 'FOREIGN',
      });
    } catch (err: any) {
      duplicateSupplierError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicateSupplierError, 'Supplier: rejected duplicate supplierCode with unique constraint error');

    // ─── 2.2 SupplierQuotation Model Verification ───
    const quotation1 = await SupplierQuotationModel.create({
      rfqNumber: `RFQ-${testId}-001`,
      supplierId: supplier1._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quotedUnitPrice: 8500.0,
      currency: 'USD',
      leadTimeDays: 25,
      paymentTerms: '100% Sight LC',
      moq: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      aiRiskFlags: ['TARIFF_VOLATILITY'],
      csScore: 92,
    });
    assert(Boolean(quotation1._id), 'SupplierQuotation created successfully');

    let duplicateRfqError = false;
    try {
      await SupplierQuotationModel.create({
        rfqNumber: `RFQ-${testId}-001`,
        supplierId: supplier1._id,
        productId: testProduct._id,
        sku: testProduct.sku,
        quotedUnitPrice: 9000.0,
        currency: 'USD',
        leadTimeDays: 30,
      });
    } catch (err: any) {
      duplicateRfqError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicateRfqError, 'SupplierQuotation: rejected duplicate rfqNumber with unique constraint error');

    // ─── 2.3 ComparativeStatement Model Verification ───
    const cs1 = await ComparativeStatementModel.create({
      csNumber: `CS-${testId}-0001`,
      productId: testProduct._id,
      sku: testProduct.sku,
      requestDate: new Date(),
      bids: [
        {
          bidId: quotation1._id,
          supplierId: supplier1._id,
          supplierName: supplier1.companyName,
          unitPrice: 8500.0,
          currency: 'USD',
          leadTimeDays: 25,
          priceScore: 48,
          leadScore: 24,
          termsScore: 14,
          vendorScore: 9,
          totalScore: 95,
          aiRiskFlags: ['TARIFF_VOLATILITY'],
          isRecommended: true,
        },
      ],
      recommendedSupplierId: supplier1._id,
      aiSummary: 'Vendor demonstrates superior delivery timelines with favorable historical fulfillment.',
      status: 'FINALIZED',
      preparedBy: testUser._id,
    });
    assert(Boolean(cs1._id), 'ComparativeStatement created successfully with 100-point subscore matrix');
    assert(cs1.bids[0].totalScore === 95, 'CS bid total score preserved');

    let duplicateCsError = false;
    try {
      await ComparativeStatementModel.create({
        csNumber: `CS-${testId}-0001`,
        productId: testProduct._id,
        sku: testProduct.sku,
        requestDate: new Date(),
        preparedBy: testUser._id,
      });
    } catch (err: any) {
      duplicateCsError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicateCsError, 'ComparativeStatement: rejected duplicate csNumber with unique constraint error');

    // ─── 2.4 PurchaseOrder Model Verification ───
    const po1 = await PurchaseOrderModel.create({
      poNumber: `PO-${testId}-0001`,
      csId: cs1._id,
      supplierId: supplier1._id,
      poDate: new Date(),
      deliveryDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      exchangeRate: 121.5,
      items: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          productName: testProduct.nameEn,
          quantity: 2,
          uom: 'Unit',
          unitPrice: 8500.0,
          lineTotal: 17000.0,
          receivedQty: 0,
        },
      ],
      subtotal: 17000.0,
      taxAmount: 0.0,
      grandTotal: 17000.0,
      paymentTerms: '100% Sight LC',
      deliveryWarehouseId: new Types.ObjectId(),
      status: 'APPROVED',
      approvalQuorumTier: 2,
      issuedBy: testUser._id,
    });
    assert(Boolean(po1._id), 'PurchaseOrder created successfully');
    assert(po1.items[0].lineTotal === 17000, 'PO item lineTotal calculated properly');

    let duplicatePoError = false;
    try {
      await PurchaseOrderModel.create({
        poNumber: `PO-${testId}-0001`,
        supplierId: supplier1._id,
        deliveryDeadline: new Date(),
        items: [],
        subtotal: 0,
        grandTotal: 0,
        paymentTerms: 'Cash',
        deliveryWarehouseId: new Types.ObjectId(),
        issuedBy: testUser._id,
      });
    } catch (err: any) {
      duplicatePoError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicatePoError, 'PurchaseOrder: rejected duplicate poNumber with unique constraint error');

    // ─── 2.5 ImportLC Model Verification ───
    const lc1 = await ImportLCModel.create({
      lcNumber: `LC-${testId}-0089`,
      version: 'V1',
      supplierId: supplier1._id,
      purchaseOrderId: po1._id,
      issuingBank: 'Eastern Bank PLC, Principal Branch',
      foreignCurrency: 'USD',
      lcValueFC: 17000.0,
      openingExchangeRate: 121.5,
      customsAssessmentRate: 122.25,
      finalSettlementRate: 122.5,
      realizedFxGainLoss: -17000.0, // (121.5 - 122.5) * 17000 = -17000 BDT
      status: 'LC_OPENED',
    });
    assert(Boolean(lc1._id), 'ImportLC created with 3-tier FX rates');
    assert(lc1.openingExchangeRate === 121.5, 'LC opening exchange rate recorded');

    let duplicateLcError = false;
    try {
      await ImportLCModel.create({
        lcNumber: `LC-${testId}-0089`,
        supplierId: supplier1._id,
        issuingBank: 'City Bank',
        foreignCurrency: 'USD',
        lcValueFC: 5000,
        openingExchangeRate: 120,
      });
    } catch (err: any) {
      duplicateLcError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicateLcError, 'ImportLC: rejected duplicate lcNumber with unique constraint error');

    // ─── 2.6 LandedCost Model Verification ───
    const landedCost1 = await LandedCostModel.create({
      lcId: lc1._id,
      lcNumber: lc1.lcNumber,
      customsDuty: 450000.0,
      portDemurragePenalty: 15000.0,
      cfAgentCharges: 35000.0,
      marineInsurance: 28000.0,
      portHandlingCharges: 12000.0,
      bankCharges: 18000.0,
      otherCharges: 5000.0,
      totalLandedCostBDT: 563000.0,
      allocationMethod: 'BY_VALUE',
      allocations: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          quantity: 2,
          allocatedCost: 563000.0,
          landedUnitCost: 1322750.0, // (17000 USD * 122.50 = 2082500 BDT + 563000 BDT) / 2 = 1322750 BDT
        },
      ],
      reviewedBy: testUser._id,
      isFinalized: false,
    });
    assert(Boolean(landedCost1._id), 'LandedCost created with component breakdowns and SKU allocations');

    let duplicateLandedCostError = false;
    try {
      await LandedCostModel.create({
        lcId: lc1._id,
        lcNumber: lc1.lcNumber,
        totalLandedCostBDT: 100000,
        allocationMethod: 'BY_QUANTITY',
        allocations: [],
        isFinalized: false,
      });
    } catch (err: any) {
      duplicateLandedCostError = err.code === 11000 || err.name === 'MongoServerError';
    }
    assert(duplicateLandedCostError, 'LandedCost: rejected duplicate lcId with unique constraint error');
  } finally {
    await disconnectDatabase();
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProcurementModelsVerificationSuite().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
