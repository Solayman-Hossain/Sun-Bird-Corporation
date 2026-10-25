import { Types } from 'mongoose';
import http from 'http';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  SupplierModel,
  PurchaseOrderModel,
  ImportLCModel,
  LandedCostModel,
  ProductModel,
  ProductBatchModel,
  StockLedgerModel,
  JournalEntryModel,
  UserModel,
  RoleModel,
  WarehouseModel,
  ComparativeStatementModel,
  SupplierQuotationModel,
} from '../models/index';
import TokenService from '../services/TokenService';

interface HttpResponse {
  status: number;
  body: any;
  headers: http.IncomingHttpHeaders;
}

function makeRequest(
  path: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const requestHeaders: Record<string, string | number> = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (body) {
      requestHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        path,
        method,
        headers: requestHeaders,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => {
          resData += chunk;
        });
        res.on('end', () => {
          let parsedBody = null;
          try {
            parsedBody = resData ? JSON.parse(resData) : null;
          } catch {
            parsedBody = resData;
          }
          resolve({
            status: res.statusCode || 500,
            body: parsedBody,
            headers: res.headers,
          });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runLcLandedCostVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPTS 21–23: IMPORT LC ENGINE, DEMURRAGE CALCULATOR,');
  console.log('  LANDED COST ALLOCATION, BATCH WAC CAPITALIZATION & GRN JVs');
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

  const runId = Math.random().toString(36).substring(2, 8).toUpperCase();
  let server: http.Server | null = null;

  try {
    // 1. Connect DB and start Express server
    await connectDatabase().catch(() => {});

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server!.listen(0, () => resolve());
    });
    const port = (server.address() as any).port;

    const callApi = (
      path: string,
      method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
      body?: any,
      headers: Record<string, string> = {}
    ) => {
      return new Promise<HttpResponse>((resolve, reject) => {
        const postData = body ? JSON.stringify(body) : '';
        const requestHeaders: Record<string, string | number> = {
          'Content-Type': 'application/json',
          ...headers,
        };
        if (body) {
          requestHeaders['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = http.request(
          {
            hostname: '127.0.0.1',
            port,
            path,
            method,
            headers: requestHeaders,
          },
          (res) => {
            let resData = '';
            res.on('data', (chunk) => {
              resData += chunk;
            });
            res.on('end', () => {
              let parsedBody = null;
              try {
                parsedBody = resData ? JSON.parse(resData) : null;
              } catch {
                parsedBody = resData;
              }
              resolve({
                status: res.statusCode || 500,
                body: parsedBody,
                headers: res.headers,
              });
            });
          }
        );

        req.on('error', (err) => reject(err));
        if (postData) {
          req.write(postData);
        }
        req.end();
      });
    };

    // 2. Setup RBAC Role & Procurement Officer User
    let procRole = await RoleModel.findOne({ slug: 'procurement-manager' });
    if (!procRole) {
      procRole = await RoleModel.create({
        roleName: 'Procurement Manager',
        slug: 'procurement-manager',
        permissions: [
          {
            module: 'procurement',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT'],
          },
        ],
        isSystemRole: false,
        isActive: true,
      });
    }

    const procurementOfficer = await UserModel.create({
      fullName: `LC Officer ${runId}`,
      email: `lc.officer.${runId.toLowerCase()}@sunbird.com.bd`,
      mobile: `+8801712${Math.floor(100000 + Math.random() * 900000)}`,
      userType: 'STAFF',
      roleId: procRole._id,
      isActive: true,
    });

    const procAuthToken = TokenService.generateAccessToken(procurementOfficer);
    const procHeaders = { Authorization: `Bearer ${procAuthToken}` };

    // 3. Setup Master Product, Central Warehouse, and Foreign Supplier
    const testProduct = await ProductModel.create({
      sku: `PROD-LC-${runId}`,
      nameEn: 'Mindray Resona I9 Ultrasound System',
      nameBn: 'মাইন্ডরে রেসোনা আই৯ আল্ট্রাসাউন্ড',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.12.00',
      baseUom: 'Unit',
      retailPrice: 3500000,
      showroomPrice: 3200000,
      isMedical: true,
      isActive: true,
    });

    const testWarehouse = await WarehouseModel.create({
      warehouseCode: `WH-LC-${runId}`,
      name: 'Chittagong Port Customs Warehouse',
      type: 'CENTRAL',
      address: 'Agrabad Commercial Area, Chittagong',
      district: 'Chittagong',
      isCentralHub: true,
      isActive: true,
    });

    const testSupplier = await SupplierModel.create({
      supplierCode: `SUP-LC-${runId}`,
      companyName: 'Shenzhen Mindray Bio-Medical Electronics Co., Ltd.',
      country: 'China',
      currency: 'USD',
      supplierType: 'FOREIGN',
      paymentTerms: '100% Sight LC',
      swiftCode: 'BKCHCNBJ920',
      aiRiskScore: 95,
      isActive: true,
    });

    // 4. Setup Purchase Order
    const po = await PurchaseOrderModel.create({
      poNumber: `PO-${runId}-0089`,
      supplierId: testSupplier._id,
      poDate: new Date(),
      deliveryDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      currency: 'USD',
      exchangeRate: 120.0,
      items: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          productName: testProduct.nameEn,
          quantity: 10,
          uom: 'Unit',
          unitPrice: 5000.0,
          lineTotal: 50000.0,
          receivedQty: 0,
        },
      ],
      subtotal: 50000.0,
      grandTotal: 50000.0,
      paymentTerms: '100% Sight LC',
      deliveryWarehouseId: testWarehouse._id,
      status: 'APPROVED',
      approvalQuorumTier: 3,
      issuedBy: procurementOfficer._id,
    });

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 1: PROMPT 21 — IMPORT LC LIFECYCLE & DEMURRAGE CALCULATOR
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 1: Import LC Lifecycle, 3-Tier FX Rates & Demurrage ---');

    // 1.1 Open LC via POST /api/v1/erp/procurement/lcs (1st-Tier Opening Rate)
    const openLcRes = await callApi(
      '/api/v1/erp/procurement/lcs',
      'POST',
      {
        lcNumber: `LC-${runId}-0089`,
        supplierId: testSupplier._id.toString(),
        purchaseOrderId: po._id.toString(),
        issuingBank: 'Standard Chartered Bank Bangladesh',
        foreignCurrency: 'USD',
        lcValueFC: 50000.0,
        openingExchangeRate: 120.0,
        portFreeDays: 4,
        demurrageDailyRateBDT: 5000,
      },
      procHeaders
    );

    assert(openLcRes.status === 201, 'POST /api/v1/erp/procurement/lcs returns 201 Created');
    assert(openLcRes.body?.data?.status === 'LC_OPENED', 'LC initial stage is LC_OPENED');
    assert(
      openLcRes.body?.data?.openingExchangeRate === 120.0,
      '1st-Tier Opening Exchange Rate recorded as 120.0 BDT/USD'
    );
    const lcId = openLcRes.body?.data?._id;

    // 1.2 Transition to SHIPMENT_IN_TRANSIT
    const transitRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}/stage`,
      'PUT',
      {
        nextStage: 'SHIPMENT_IN_TRANSIT',
        notes: 'Vessel Maersk Dhaka departed port of origin',
      },
      procHeaders
    );

    assert(transitRes.status === 200, 'Stage transition to SHIPMENT_IN_TRANSIT returns 200 OK');
    assert(
      transitRes.body?.data?.status === 'SHIPMENT_IN_TRANSIT',
      'LC stage updated to SHIPMENT_IN_TRANSIT'
    );

    // 1.3 Port Arrival: Transition to PORT_ARRIVED
    const arrivalDate = '2026-10-01T08:00:00Z';
    const arrivalRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}/stage`,
      'PUT',
      {
        nextStage: 'PORT_ARRIVED',
        portArrivalDate: arrivalDate,
      },
      procHeaders
    );

    assert(arrivalRes.status === 200, 'Stage transition to PORT_ARRIVED returns 200 OK');
    assert(arrivalRes.body?.data?.status === 'PORT_ARRIVED', 'LC stage updated to PORT_ARRIVED');

    // 1.4 2nd-Tier FX: Record Customs Assessment Rate at Port Arrival
    const assessmentRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}/customs-assessment`,
      'PUT',
      {
        customsAssessmentRate: 122.5,
      },
      procHeaders
    );

    assert(assessmentRes.status === 200, 'PUT /lcs/:id/customs-assessment returns 200 OK');
    assert(
      assessmentRes.body?.data?.customsAssessmentRate === 122.5,
      '2nd-Tier Customs Assessment Rate recorded as 122.50 BDT/USD'
    );
    assert(
      assessmentRes.body?.data?.status === 'CUSTOMS_ASSESSED',
      'LC status updated to CUSTOMS_ASSESSED'
    );

    // 1.5 Demurrage Calculator Verification: Port clearance takes 10 days
    // Arrival: 2026-10-01T00:00:00Z, Clearance: 2026-10-11T00:00:00Z (Exactly 10 days)
    // Free window: 4 days. Billable days: 10 - 4 = 6 days.
    // Daily rate: 5,000 BDT -> Demurrage Penalty: 6 * 5000 = 30,000 BDT
    const clearanceDate = '2026-10-11T00:00:00Z';
    const demurrageRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}/calculate-demurrage`,
      'POST',
      {
        arrivalDate: '2026-10-01T00:00:00Z',
        clearanceDate,
        freeDays: 4,
        dailyRateBDT: 5000,
      },
      procHeaders
    );

    assert(demurrageRes.status === 200, 'POST /lcs/:id/calculate-demurrage returns 200 OK');
    const demurrageData = demurrageRes.body?.demurrage;
    assert(
      demurrageData?.totalPortDays === 10,
      `Port dwell time: expected 10 days, got ${demurrageData?.totalPortDays}`
    );
    assert(
      demurrageData?.freeDays === 4,
      `Port free window: expected 4 days, got ${demurrageData?.freeDays}`
    );
    assert(
      demurrageData?.billableDays === 6,
      `Demurrage billable days: expected 6 days (10 - 4), got ${demurrageData?.billableDays}`
    );
    assert(
      demurrageData?.totalPenaltyBDT === 30000,
      `Demurrage penalty calculation: expected 30,000 BDT (6 * 5000), got ${demurrageData?.totalPenaltyBDT} BDT`
    );

    // 1.6 Transition to CUSTOMS_CLEARED
    const clearanceRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}/stage`,
      'PUT',
      {
        nextStage: 'CUSTOMS_CLEARED',
        customsClearanceDate: clearanceDate,
      },
      procHeaders
    );

    assert(clearanceRes.status === 200, 'Stage transition to CUSTOMS_CLEARED returns 200 OK');
    assert(
      clearanceRes.body?.data?.status === 'CUSTOMS_CLEARED',
      'LC stage updated to CUSTOMS_CLEARED'
    );
    assert(
      clearanceRes.body?.data?.calculatedDemurragePenaltyBDT === 30000,
      'Demurrage penalty (30,000 BDT) preserved on LC document'
    );

    // 1.7 3rd-Tier FX: Bank Final Settlement & Realized FX Variance
    // Final Settlement Rate = 124.00 BDT/USD
    // Opening Rate = 120.00 BDT/USD
    // Rate Variance = +4.00 BDT/USD
    // Realized FX Variance = 4.00 * 50,000 USD = +200,000 BDT (Forex expense/loss)
    const settleRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}/settle`,
      'PUT',
      {
        finalSettlementRate: 124.0,
      },
      procHeaders
    );

    assert(settleRes.status === 200, 'PUT /lcs/:id/settle returns 200 OK');
    assert(
      settleRes.body?.data?.finalSettlementRate === 124.0,
      '3rd-Tier Final Settlement Rate recorded as 124.00 BDT/USD'
    );
    assert(
      settleRes.body?.data?.realizedFxGainLoss === 200000,
      `Realized FX variance: expected 200,000 BDT, got ${settleRes.body?.data?.realizedFxGainLoss} BDT`
    );
    assert(
      settleRes.body?.data?.status === 'FINAL_SETTLEMENT',
      'LC stage finalized to FINAL_SETTLEMENT'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 2: PROMPT 22 — LANDED COST ALLOCATION ENGINE
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 2: Landed Cost Allocation Engine ---');

    // Consignment parameters:
    // Item 1: 10 Units, FOB = 50,000 USD * 120 = 6,000,000 BDT
    // Cost breakdown:
    // Customs Duty (CD): 500,000
    // Regulatory Duty (RD): 150,000
    // AIT: 100,000
    // VAT: 300,000
    // C&F: 75,000
    // Demurrage Penalty: 30,000 (from 10-day dwell calculation)
    // Port Handling: 45,000
    // Inland Freight: 50,000
    // Marine Insurance: 60,000
    // Bank Charges: 40,000
    // Other Charges: 20,000
    // Total Expenditure = 1,370,000 BDT
    // Total Landed Cost = 6,000,000 + 1,370,000 = 7,370,000 BDT
    // Landed Unit Cost = 7,370,000 / 10 = 737,000 BDT / unit
    const createLandedCostRes = await callApi(
      '/api/v1/erp/procurement/landed-costs',
      'POST',
      {
        lcId: lcId.toString(),
        costBreakdown: {
          fobValueBDT: 6000000.0,
          customsDuty: 500000.0,
          regulatoryDuty: 150000.0,
          advanceIncomeTax: 100000.0,
          vatAmount: 300000.0,
          cfAgentCharges: 75000.0,
          portDemurragePenalty: 30000.0,
          portHandlingCharges: 45000.0,
          inlandFreight: 50000.0,
          marineInsurance: 60000.0,
          bankCharges: 40000.0,
          otherCharges: 20000.0,
        },
        allocationMethod: 'BY_VALUE',
        items: [
          {
            productId: testProduct._id.toString(),
            sku: testProduct.sku,
            quantity: 10,
            fobValueBDT: 6000000.0,
            weightKg: 250,
          },
        ],
      },
      procHeaders
    );

    assert(createLandedCostRes.status === 201, 'POST /api/v1/erp/procurement/landed-costs returns 201 Created');
    const landedCostData = createLandedCostRes.body?.data;
    assert(
      landedCostData?.totalLandedCostBDT === 7370000,
      `Total Landed Cost BDT: expected 7,370,000 BDT, got ${landedCostData?.totalLandedCostBDT}`
    );
    assert(
      landedCostData?.portDemurragePenalty === 30000,
      'Port demurrage penalty (30,000 BDT) integrated into landed cost sheet'
    );
    assert(
      landedCostData?.allocations?.[0]?.allocatedCost === 1370000,
      `Allocated import expenditure: expected 1,370,000 BDT, got ${landedCostData?.allocations?.[0]?.allocatedCost}`
    );
    assert(
      landedCostData?.allocations?.[0]?.landedUnitCost === 737000,
      `Calculated landed unit cost: expected 737,000 BDT/unit, got ${landedCostData?.allocations?.[0]?.landedUnitCost}`
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 3: PROMPT 22 — FINALIZATION, BATCH WAC & ACCOUNTING JVs
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 3: Finalization, Batch Capitalization & Double-Entry JVs ---');

    // Finalize landed cost via PUT /api/v1/erp/procurement/landed-costs/:lcId/finalize
    const finalizeRes = await callApi(
      `/api/v1/erp/procurement/landed-costs/${lcId}/finalize`,
      'PUT',
      {},
      procHeaders
    );

    assert(finalizeRes.status === 200, 'PUT /landed-costs/:lcId/finalize returns 200 OK');
    assert(
      finalizeRes.body?.data?.isFinalized === true,
      'Landed cost record marked isFinalized: true'
    );

    // 3.1 Verify Batch Unit Cost Capitalization
    const capitalizedBatches = finalizeRes.body?.batches;
    assert(
      Array.isArray(capitalizedBatches) && capitalizedBatches.length > 0,
      'Received updated product batch array'
    );
    const updatedBatch = capitalizedBatches[0];
    assert(
      updatedBatch?.unitCost === 737000,
      `Batch unitCost capitalized to landed unit cost: expected 737,000 BDT, got ${updatedBatch?.unitCost}`
    );
    assert(
      updatedBatch?.currentQty === 10,
      `Batch currentQty credited with incoming 10 units: got ${updatedBatch?.currentQty}`
    );

    // Verify batch in MongoDB Atlas
    const dbBatch = await ProductBatchModel.findById(updatedBatch?._id);
    assert(Boolean(dbBatch), 'Batch persisted in product_batches collection');
    assert(dbBatch?.unitCost === 737000, 'Persisted batch unitCost matches 737,000 BDT');

    // 3.2 Verify Automatic Goods Receipt Note (GRN) in stock_ledger
    const dbLedger = await StockLedgerModel.findOne({
      batchId: dbBatch?._id,
      movementType: 'GRN_IN',
    });
    assert(Boolean(dbLedger), 'Automatic GRN_IN entry recorded in stock_ledger');
    assert(dbLedger?.qtyChange === 10, 'Stock ledger recorded +10 units received');
    assert(dbLedger?.unitCost === 737000, 'Stock ledger recorded capitalized landed unit cost');

    // 3.3 Verify Balanced Double-Entry Accounting Journal Entry (JV)
    // Debit 1200 Inventory Asset = 7,370,000
    // Credit 2010 Accounts Payable = 6,000,000
    // Credit 2020 Customs & Port Liabilities = 1,370,000
    const jv = finalizeRes.body?.journalEntry;
    assert(Boolean(jv), 'Double-entry Journal Entry returned in response');
    assert(jv?.status === 'POSTED', 'Journal entry status is POSTED');
    assert(
      jv?.totalDebit === 7370000 && jv?.totalCredit === 7370000,
      `Journal entry is strictly balanced: Debit (${jv?.totalDebit}) == Credit (${jv?.totalCredit})`
    );

    const debitLine = jv?.lines?.find((l: any) => l.accountCode === 1200);
    const creditApLine = jv?.lines?.find((l: any) => l.accountCode === 2010);
    const creditDutiesLine = jv?.lines?.find((l: any) => l.accountCode === 2020);

    assert(Boolean(debitLine), 'Debit line for 1200 Inventory Asset present');
    assert(debitLine?.debit === 7370000, '1200 Inventory Asset debited with full 7,370,000 BDT');
    assert(Boolean(creditApLine), 'Credit line for 2010 Accounts Payable present');
    assert(creditApLine?.credit === 6000000, '2010 Accounts Payable credited with FOB 6,000,000 BDT');
    assert(Boolean(creditDutiesLine), 'Credit line for 2020 Customs/Duties present');
    assert(creditDutiesLine?.credit === 1370000, '2020 Customs Duties credited with 1,370,000 BDT');

    // 3.4 Attempt duplicate finalization (should fail)
    const duplicateFinalizeRes = await callApi(
      `/api/v1/erp/procurement/landed-costs/${lcId}/finalize`,
      'PUT',
      {},
      procHeaders
    );
    assert(
      duplicateFinalizeRes.status === 400,
      'Duplicate finalization correctly rejected with 400 Validation Error'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 4: PROMPT 23 — PROCUREMENT ROUTES & COMPARATIVE STATEMENT
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 4: Prompt 23 Route Grid & Verification Request ---');

    // 4.1 Get LC by ID
    const getLcRes = await callApi(
      `/api/v1/erp/procurement/lcs/${lcId}`,
      'GET',
      undefined,
      procHeaders
    );
    assert(getLcRes.status === 200, 'GET /api/v1/erp/procurement/lcs/:id returns 200 OK');
    assert(getLcRes.body?.data?.supplierId?.companyName === testSupplier.companyName, 'LC supplier populated');

    // 4.2 Get Landed Cost by LC ID
    const getLandedRes = await callApi(
      `/api/v1/erp/procurement/landed-costs/${lcId}`,
      'GET',
      undefined,
      procHeaders
    );
    assert(getLandedRes.status === 200, 'GET /api/v1/erp/procurement/landed-costs/:lcId returns 200 OK');
    assert(
      getLandedRes.body?.data?.totalLandedCostBDT === 7370000,
      'Retrieved landed cost matches 7,370,000 BDT'
    );

    // 4.3 Prompt 23 Verification Requirement:
    // "Execute POST request to create Comparative Statement and assert response structure."
    const csRfqNumber = `RFQ-CS-${runId}-0099`;
    await SupplierQuotationModel.create({
      rfqNumber: csRfqNumber,
      supplierId: testSupplier._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quotedUnitPrice: 4800.0,
      currency: 'USD',
      leadTimeDays: 20,
      paymentTerms: '100% Sight LC',
    });

    const createCsRes = await callApi(
      '/api/v1/erp/procurement/comparative-statements',
      'POST',
      {
        rfqNumber: csRfqNumber,
      },
      procHeaders
    );

    assert(
      createCsRes.status === 201,
      'POST /api/v1/erp/procurement/comparative-statements returns 201 Created'
    );
    assert(
      createCsRes.body?.success === true,
      'Comparative statement creation response success is true'
    );
    assert(
      Boolean(createCsRes.body?.data?.csNumber),
      'Comparative statement contains generated csNumber'
    );
    assert(
      Array.isArray(createCsRes.body?.data?.bids) && createCsRes.body?.data?.bids.length > 0,
      'Comparative statement contains evaluated bids array'
    );
    assert(
      typeof createCsRes.body?.data?.aiSummary === 'string' &&
        createCsRes.body?.data?.aiSummary.length > 0,
      'Comparative statement response contains generated aiSummary'
    );
  } catch (err: any) {
    console.error(`💥 Unexpected error in verification suite: ${err.message}`, err.stack);
    failed++;
  } finally {
    if (server) {
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    await disconnectDatabase();
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLcLandedCostVerificationSuite();
