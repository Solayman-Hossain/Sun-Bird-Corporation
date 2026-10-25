import { Types } from 'mongoose';
import http from 'http';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  SupplierModel,
  ComparativeStatementModel,
  PurchaseOrderModel,
  ProductModel,
  UserModel,
  RoleModel,
  WarehouseModel,
  QuorumApprovalModel,
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

async function runPoQuorumVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 20: PURCHASE ORDER GENERATION & AUTOMATED QUORUM APPROVAL TIER');
  console.log('  (SEQUENTIAL COUNTER, BDT FX CONVERSION, 4-TIER GOVERNANCE MATRIX)');
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

    const procurementStaff = await UserModel.create({
      fullName: `Procurement Officer ${runId}`,
      email: `po.officer.${runId.toLowerCase()}@sunbird.com.bd`,
      mobile: `+8801711${Math.floor(100000 + Math.random() * 900000)}`,
      userType: 'STAFF',
      roleId: procRole._id,
      isActive: true,
    });

    const procAuthToken = TokenService.generateAccessToken(procurementStaff);
    const procHeaders = { Authorization: `Bearer ${procAuthToken}` };

    // 3. Setup Master Product & Central Warehouse
    const testProduct = await ProductModel.create({
      sku: `PROD-PO-${runId}`,
      nameEn: 'Mindray Resona 7 Premium Ultrasound System',
      nameBn: 'মাইন্ডরে রেসোনা ৭ প্রিমিয়াম আল্ট্রাসাউন্ড',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.12.00',
      baseUom: 'Unit',
      retailPrice: 4500000,
      showroomPrice: 4200000,
      isMedical: true,
      isActive: true,
    });

    const testWarehouse = await WarehouseModel.create({
      warehouseCode: `WH-${runId}-01`,
      name: 'Dhaka Central Technology Depot',
      type: 'CENTRAL',
      address: '24 Tejgaon I/A, Dhaka-1208',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });

    // 4. Setup Test Supplier
    const testSupplier = await SupplierModel.create({
      supplierCode: `SUP-PO-${runId}`,
      companyName: 'Mindray Medical International Ltd.',
      country: 'China',
      currency: 'BDT',
      supplierType: 'FOREIGN',
      paymentTerms: '100% Sight LC',
      aiRiskScore: 92,
      isActive: true,
    });

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 1: VERIFICATION REQUIREMENT (1,500,000 BDT -> TIER 3 QUORUM)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 1: Verification Requirement (1,500,000 BDT PO -> Tier 3 Quorum) ---');

    // Create Finalized CS with 1,500,000 BDT winning bid
    const csTier3 = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-T3`,
      productId: testProduct._id,
      sku: testProduct.sku,
      requestDate: new Date(),
      bids: [
        {
          supplierId: testSupplier._id,
          supplierName: testSupplier.companyName,
          unitPrice: 1500000.0,
          currency: 'BDT',
          leadTimeDays: 20,
          paymentTerms: '100% Sight LC',
          priceScore: 50,
          leadScore: 25,
          termsScore: 10,
          vendorScore: 9.2,
          totalScore: 94.2,
          isRecommended: true,
        },
      ],
      recommendedSupplierId: testSupplier._id,
      aiSummary: 'Recommended for procurement under Tier 3 approval.',
      status: 'FINALIZED',
      preparedBy: procurementStaff._id,
      approvedBy: procurementStaff._id,
    });

    const createPoRes = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: csTier3._id.toString(),
        winningBidId: testSupplier._id.toString(),
        quantity: 1,
        deliveryWarehouseId: testWarehouse._id.toString(),
      },
      procHeaders
    );

    assert(createPoRes.status === 201, 'POST /api/v1/erp/procurement/purchase-orders/from-cs returns 201 Created');
    const po15L = createPoRes.body?.data;
    const quorumRecord15L = createPoRes.body?.quorumApproval;

    assert(
      /^PO-\d{4}-\d{5}$/.test(po15L?.poNumber),
      `Sequential PO number formatted correctly via CounterService: ${po15L?.poNumber}`
    );
    assert(
      po15L?.grandTotal === 1500000,
      `Purchase Order grandTotal matches 1,500,000 BDT (got: ${po15L?.grandTotal})`
    );
    assert(
      po15L?.approvalQuorumTier === 3,
      `Automatic assignment of Tier 3 Quorum requirement for 1,500,000 BDT (got: Tier ${po15L?.approvalQuorumTier})`
    );
    assert(
      po15L?.status === 'SUBMITTED',
      'PO status automatically set to SUBMITTED awaiting multi-director quorum approval'
    );
    assert(
      Boolean(quorumRecord15L),
      'Quorum approval record generated and returned in response payload'
    );

    // Verify quorum_approvals collection in DB
    const dbQuorum = await QuorumApprovalModel.findOne({
      targetId: new Types.ObjectId(po15L?._id),
      targetCollection: 'purchase_orders',
    });

    assert(Boolean(dbQuorum), 'Record successfully created in quorum_approvals collection');
    assert(dbQuorum?.quorumTier === 3, 'quorum_approvals record has quorumTier: 3');
    assert(dbQuorum?.requiredCount === 2, 'quorum_approvals requires 2 Director signatures for Tier 3');
    assert(dbQuorum?.isComplete === false, 'quorum_approvals isComplete is false (pending signatures)');
    assert(dbQuorum?.targetRef === po15L?.poNumber, 'quorum_approvals targetRef matches PO number');

    // Verify CS status transitioned to AWARDED
    const updatedCs = await ComparativeStatementModel.findById(csTier3._id);
    assert(updatedCs?.status === 'AWARDED', 'Comparative Statement status transitioned to AWARDED');

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 2: 4-TIER APPROVAL GOVERNANCE THRESHOLD CHECKS
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 2: Full 4-Tier Approval Threshold Matrix ---');

    // 2.1 Tier 1: <= 500,000 BDT (Manager approval)
    const csTier1 = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-T1`,
      productId: testProduct._id,
      sku: testProduct.sku,
      bids: [
        {
          supplierId: testSupplier._id,
          unitPrice: 450000.0,
          currency: 'BDT',
          leadTimeDays: 15,
          totalScore: 90,
          isRecommended: true,
        },
      ],
      status: 'FINALIZED',
      preparedBy: procurementStaff._id,
    });

    const poTier1Res = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: csTier1._id.toString(),
        winningBidId: testSupplier._id.toString(),
      },
      procHeaders
    );

    assert(poTier1Res.status === 201, 'Tier 1 PO (450,000 BDT) returns 201 Created');
    assert(
      poTier1Res.body?.data?.approvalQuorumTier === 1,
      '<= 500,000 BDT assigned to approvalQuorumTier: 1'
    );
    assert(
      poTier1Res.body?.data?.status === 'DRAFT',
      'Tier 1 PO status initialized to DRAFT (single manager approval)'
    );
    assert(
      !poTier1Res.body?.quorumApproval,
      'No quorum_approvals record created for Tier 1 transaction'
    );

    // 2.2 Tier 2: 500,001 - 1,000,000 BDT (Officer/Checker approval)
    const csTier2 = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-T2`,
      productId: testProduct._id,
      sku: testProduct.sku,
      bids: [
        {
          supplierId: testSupplier._id,
          unitPrice: 850000.0,
          currency: 'BDT',
          leadTimeDays: 20,
          totalScore: 88,
          isRecommended: true,
        },
      ],
      status: 'FINALIZED',
      preparedBy: procurementStaff._id,
    });

    const poTier2Res = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: csTier2._id.toString(),
        winningBidId: testSupplier._id.toString(),
      },
      procHeaders
    );

    assert(poTier2Res.status === 201, 'Tier 2 PO (850,000 BDT) returns 201 Created');
    assert(
      poTier2Res.body?.data?.approvalQuorumTier === 2,
      '850,000 BDT assigned to approvalQuorumTier: 2'
    );
    assert(
      poTier2Res.body?.data?.status === 'DRAFT',
      'Tier 2 PO status initialized to DRAFT (checker approval)'
    );

    // 2.3 Tier 4: > 5,000,000 BDT (3 Directors Unanimous Quorum)
    const csTier4 = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-T4`,
      productId: testProduct._id,
      sku: testProduct.sku,
      bids: [
        {
          supplierId: testSupplier._id,
          unitPrice: 6500000.0,
          currency: 'BDT',
          leadTimeDays: 30,
          totalScore: 85,
          isRecommended: true,
        },
      ],
      status: 'FINALIZED',
      preparedBy: procurementStaff._id,
    });

    const poTier4Res = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: csTier4._id.toString(),
        winningBidId: testSupplier._id.toString(),
      },
      procHeaders
    );

    assert(poTier4Res.status === 201, 'Tier 4 PO (6,500,000 BDT) returns 201 Created');
    assert(
      poTier4Res.body?.data?.approvalQuorumTier === 4,
      '> 5,000,000 BDT assigned to approvalQuorumTier: 4'
    );
    assert(
      poTier4Res.body?.data?.status === 'SUBMITTED',
      'Tier 4 PO status initialized to SUBMITTED'
    );
    assert(
      poTier4Res.body?.quorumApproval?.requiredCount === 3,
      'Tier 4 Quorum Approval strictly requires 3 Director signatures (unanimous quorum)'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 3: FOREIGN CURRENCY EXCHANGE RATE CONVERSION
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 3: Foreign Currency FX Rate Conversion ---');

    // 20,000 USD @ 120 BDT/USD = 2,400,000 BDT (falls in Tier 3: 1M - 5M)
    const csUsd = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-USD`,
      productId: testProduct._id,
      sku: testProduct.sku,
      bids: [
        {
          supplierId: testSupplier._id,
          unitPrice: 20000.0,
          currency: 'USD',
          leadTimeDays: 25,
          totalScore: 92,
          isRecommended: true,
        },
      ],
      status: 'FINALIZED',
      preparedBy: procurementStaff._id,
    });

    const poUsdRes = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: csUsd._id.toString(),
        winningBidId: testSupplier._id.toString(),
        exchangeRate: 120.0,
      },
      procHeaders
    );

    assert(poUsdRes.status === 201, 'USD PO creation returns 201 Created');
    assert(
      poUsdRes.body?.data?.currency === 'USD',
      'PO currency correctly preserved as USD'
    );
    assert(
      poUsdRes.body?.data?.exchangeRate === 120.0,
      'PO exchange rate recorded as 120.0 BDT/USD'
    );
    assert(
      poUsdRes.body?.data?.approvalQuorumTier === 3,
      'USD conversion (20,000 USD * 120 = 2,400,000 BDT) automatically triggers Tier 3 Quorum'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 4: BUSINESS CONSTRAINTS & AUDIT GUARDS
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 4: Business Constraints & Guard Validations ---');

    // 4.1 Reject PO generation from un-finalized CS (status 'DRAFT')
    const unfinalizedCs = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-DRAFT`,
      productId: testProduct._id,
      sku: testProduct.sku,
      bids: [
        {
          supplierId: testSupplier._id,
          unitPrice: 100000,
          currency: 'BDT',
          totalScore: 80,
          isRecommended: true,
        },
      ],
      status: 'DRAFT',
      preparedBy: procurementStaff._id,
    });

    const unfinalizedPoRes = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: unfinalizedCs._id.toString(),
        winningBidId: testSupplier._id.toString(),
      },
      procHeaders
    );

    assert(
      unfinalizedPoRes.status === 400,
      'PO generation from un-finalized (DRAFT) CS rejected with 400 Validation Error'
    );

    // 4.2 Reject unknown winningBidId
    const csFinalizedForBadBid = await ComparativeStatementModel.create({
      csNumber: `CS-${runId}-BADBID`,
      productId: testProduct._id,
      sku: testProduct.sku,
      bids: [
        {
          supplierId: testSupplier._id,
          unitPrice: 100000,
          currency: 'BDT',
          totalScore: 80,
          isRecommended: true,
        },
      ],
      status: 'FINALIZED',
      preparedBy: procurementStaff._id,
    });

    const badBidRes = await callApi(
      '/api/v1/erp/procurement/purchase-orders/from-cs',
      'POST',
      {
        csId: csFinalizedForBadBid._id.toString(),
        winningBidId: new Types.ObjectId().toString(),
      },
      procHeaders
    );

    assert(
      badBidRes.status === 404,
      'Unknown winningBidId rejected with 404 Not Found'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 5: PO RETRIEVAL & FILTER QUERY ENDPOINTS
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 5: PO Retrieval & Filter Query Endpoints ---');

    // 5.1 Get PO by ID
    const getPoRes = await callApi(
      `/api/v1/erp/procurement/purchase-orders/${po15L._id}`,
      'GET',
      undefined,
      procHeaders
    );

    assert(getPoRes.status === 200, 'GET /api/v1/erp/procurement/purchase-orders/:id returns 200 OK');
    assert(
      getPoRes.body?.data?.supplierId?.companyName === testSupplier.companyName,
      'PO supplier details populated'
    );
    assert(
      getPoRes.body?.data?.deliveryWarehouseId?.warehouseCode === testWarehouse.warehouseCode,
      'PO delivery warehouse populated'
    );

    // 5.2 List POs by Quorum Tier
    const listTier3Res = await callApi(
      '/api/v1/erp/procurement/purchase-orders?approvalQuorumTier=3',
      'GET',
      undefined,
      procHeaders
    );

    assert(listTier3Res.status === 200, 'GET /api/v1/erp/procurement/purchase-orders returns 200 OK');
    assert(
      listTier3Res.body?.data?.every((p: any) => p.approvalQuorumTier === 3),
      'Filtered PO list returns only Tier 3 Quorum purchase orders'
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

runPoQuorumVerificationSuite();
