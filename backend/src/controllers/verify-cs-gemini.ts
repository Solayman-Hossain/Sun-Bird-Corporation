import { Types } from 'mongoose';
import http from 'http';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  SupplierModel,
  SupplierQuotationModel,
  ComparativeStatementModel,
  ProductModel,
  RfqModel,
  UserModel,
  RoleModel,
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

async function runCsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 19: 100-POINT CS EVALUATION MATRIX & GEMINI AI PROCUREMENT ADVISOR');
  console.log('  (CS COMPILATION, WEIGHTED SCORING, RISK FLAGS, AI SUMMARY, FINALIZATION)');
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

    // Override makeRequest default path to include server port
    const originalMakeRequest = makeRequest;
    (global as any).makeRequestWithPort = (
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

    const callApi = (global as any).makeRequestWithPort;

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
      email: `procurement.${runId.toLowerCase()}@sunbird.com.bd`,
      mobile: `+8801700${Math.floor(100000 + Math.random() * 900000)}`,
      userType: 'STAFF',
      roleId: procRole._id,
      isActive: true,
    });

    const procAuthToken = TokenService.generateAccessToken(procurementStaff);
    const procHeaders = { Authorization: `Bearer ${procAuthToken}` };

    // 3. Setup Master Product
    const testProduct = await ProductModel.create({
      sku: `PROD-CS-${runId}`,
      nameEn: 'Mindray DC-70 Color Doppler Ultrasound System',
      nameBn: 'মাইন্ডরে ডিসি-৭০ কালার ডপলার আল্ট্রাসাউন্ড',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.12.00',
      baseUom: 'Unit',
      retailPrice: 2200000,
      showroomPrice: 2100000,
      isMedical: true,
      isActive: true,
    });

    // 4. Setup 3 Competing Suppliers with distinct profiles and aiRiskScore
    // Supplier A: Chison (aiRiskScore 90 -> Vendor Score 9.00)
    const supplierA = await SupplierModel.create({
      supplierCode: `SUP-CHISON-${runId}`,
      companyName: 'Chison Medical Technologies Co., Ltd.',
      country: 'China',
      currency: 'USD',
      supplierType: 'FOREIGN',
      paymentTerms: '100% Sight LC',
      aiRiskScore: 90,
      isActive: true,
    });

    // Supplier B: Mindray (aiRiskScore 80 -> Vendor Score 8.00)
    const supplierB = await SupplierModel.create({
      supplierCode: `SUP-MINDRAY-${runId}`,
      companyName: 'Shenzhen Mindray Bio-Medical Electronics Co., Ltd.',
      country: 'China',
      currency: 'USD',
      supplierType: 'FOREIGN',
      paymentTerms: 'LC 90 days deferred',
      aiRiskScore: 80,
      isActive: true,
    });

    // Supplier C: SonoScape (aiRiskScore 70 -> Vendor Score 7.00)
    const supplierC = await SupplierModel.create({
      supplierCode: `SUP-SONOSCAPE-${runId}`,
      companyName: 'SonoScape Medical Corp.',
      country: 'China',
      currency: 'USD',
      supplierType: 'FOREIGN',
      paymentTerms: '100% Advance TT',
      aiRiskScore: 70,
      isActive: true,
    });

    // 5. Broadcast RFQ Tender
    const rfqNumber = `RFQ-CS-${runId}-001`;
    const broadcastRes = await callApi(
      '/api/v1/erp/procurement/rfqs',
      'POST',
      {
        rfqNumber,
        title: 'Tender for 5 Units Color Doppler Ultrasound',
        productId: testProduct._id.toString(),
        targetQuantity: 5,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        invitedSuppliers: [supplierA._id.toString(), supplierB._id.toString(), supplierC._id.toString()],
        notes: 'Strict requirement for CE and FDA certification',
      },
      procHeaders
    );

    assert(broadcastRes.status === 201, 'POST /api/v1/erp/procurement/rfqs broadcast returns 201 Created');

    // 6. Submit 3 competing bids:
    // Bidder A (Chison): Price = $8,000 (lowest), Lead Time = 20 days (shortest), Terms = '100% Sight LC'
    // Expected:
    //   Price: 50 * (8000/8000) = 50.00
    //   Lead:  25 * (20/20)     = 25.00
    //   Terms: Sight LC         = 10.00
    //   Vendor: 90 / 10         = 9.00
    //   Total: 50 + 25 + 10 + 9 = 94.00
    const bidA = await SupplierQuotationModel.create({
      rfqNumber,
      supplierId: supplierA._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quotedUnitPrice: 8000.0,
      currency: 'USD',
      leadTimeDays: 20,
      paymentTerms: '100% Sight LC',
      moq: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Bidder B (Mindray): Price = $8,500, Lead Time = 25 days, Terms = 'LC 90 days deferred'
    // Expected:
    //   Price: 50 * (8000/8500) = 47.06
    //   Lead:  25 * (20/25)     = 20.00
    //   Terms: LC 90 days       = 15.00
    //   Vendor: 80 / 10         = 8.00
    //   Total: 47.06 + 20.00 + 15.00 + 8.00 = 90.06
    const bidB = await SupplierQuotationModel.create({
      rfqNumber,
      supplierId: supplierB._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quotedUnitPrice: 8500.0,
      currency: 'USD',
      leadTimeDays: 25,
      paymentTerms: 'LC 90 days deferred',
      moq: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Bidder C (SonoScape): Price = $9,200, Lead Time = 30 days, Terms = '100% Advance TT'
    // Expected:
    //   Price: 50 * (8000/9200) = 43.48
    //   Lead:  25 * (20/30)     = 16.67
    //   Terms: 100% Advance     = 4.00
    //   Vendor: 70 / 10         = 7.00
    //   Total: 43.48 + 16.67 + 4.00 + 7.00 = 71.15
    const bidC = await SupplierQuotationModel.create({
      rfqNumber,
      supplierId: supplierC._id,
      productId: testProduct._id,
      sku: testProduct.sku,
      quotedUnitPrice: 9200.0,
      currency: 'USD',
      leadTimeDays: 30,
      paymentTerms: '100% Advance TT',
      moq: 1,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    assert(Boolean(bidA && bidB && bidC), 'Successfully persisted 3 competing bid quotations for RFQ');

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 1: 100-POINT CS EVALUATION MATRIX COMPILATION
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 1: CS Compilation & 100-Point Scoring Matrix ---');

    const csNumber = `CS-${runId}-0001`;
    const compileRes = await callApi(
      '/api/v1/erp/procurement/comparative-statements',
      'POST',
      {
        rfqNumber,
        csNumber,
      },
      procHeaders
    );

    assert(
      compileRes.status === 201,
      'POST /api/v1/erp/procurement/comparative-statements returns 201 Created'
    );
    assert(
      compileRes.body?.data?.csNumber === csNumber,
      'Comparative Statement document created with requested csNumber'
    );
    assert(
      compileRes.body?.data?.status === 'DRAFT',
      'Initial CS lifecycle status is DRAFT'
    );

    const csData = compileRes.body?.data;
    const bids: any[] = csData?.bids || [];
    assert(bids.length === 3, 'CS contains exactly 3 evaluated supplier bids');

    // Find each bidder in the compiled CS
    const compiledBidA = bids.find((b) => b.supplierId === supplierA._id.toString());
    const compiledBidB = bids.find((b) => b.supplierId === supplierB._id.toString());
    const compiledBidC = bids.find((b) => b.supplierId === supplierC._id.toString());

    assert(Boolean(compiledBidA), 'Bidder A (Chison) found in compiled CS matrix');
    assert(Boolean(compiledBidB), 'Bidder B (Mindray) found in compiled CS matrix');
    assert(Boolean(compiledBidC), 'Bidder C (SonoScape) found in compiled CS matrix');

    // 1.1 Assert Bidder A Scores (Lowest price & shortest lead time)
    // Price Score: 50 * (8000/8000) = 50.00
    assert(
      compiledBidA.priceScore === 50.0,
      `Bidder A Price Score: expected 50.00, received ${compiledBidA.priceScore}`
    );
    // Lead Time Score: 25 * (20/20) = 25.00
    assert(
      compiledBidA.leadScore === 25.0,
      `Bidder A Lead Time Score: expected 25.00, received ${compiledBidA.leadScore}`
    );
    // Terms Score: Sight LC = 10.00
    assert(
      compiledBidA.termsScore === 10.0,
      `Bidder A Terms Score: expected 10.00, received ${compiledBidA.termsScore}`
    );
    // Vendor Reliability Score: 90 / 10 = 9.00
    assert(
      compiledBidA.vendorScore === 9.0,
      `Bidder A Vendor Score: expected 9.00, received ${compiledBidA.vendorScore}`
    );
    // Composite Total: 50 + 25 + 10 + 9 = 94.00
    assert(
      compiledBidA.totalScore === 94.0,
      `Bidder A Composite Score: expected 94.00, received ${compiledBidA.totalScore}`
    );

    // 1.2 Assert Bidder B Scores
    // Price Score: 50 * (8000/8500) = 47.06
    assert(
      Math.abs(compiledBidB.priceScore - 47.06) <= 0.01,
      `Bidder B Price Score: expected ~47.06, received ${compiledBidB.priceScore}`
    );
    // Lead Time Score: 25 * (20/25) = 20.00
    assert(
      compiledBidB.leadScore === 20.0,
      `Bidder B Lead Time Score: expected 20.00, received ${compiledBidB.leadScore}`
    );
    // Terms Score: LC 90 days deferred = 15.00
    assert(
      compiledBidB.termsScore === 15.0,
      `Bidder B Terms Score: expected 15.00, received ${compiledBidB.termsScore}`
    );
    // Vendor Reliability Score: 80 / 10 = 8.00
    assert(
      compiledBidB.vendorScore === 8.0,
      `Bidder B Vendor Score: expected 8.00, received ${compiledBidB.vendorScore}`
    );
    // Composite Total: 47.06 + 20.00 + 15.00 + 8.00 = 90.06
    assert(
      Math.abs(compiledBidB.totalScore - 90.06) <= 0.01,
      `Bidder B Composite Score: expected ~90.06, received ${compiledBidB.totalScore}`
    );

    // 1.3 Assert Bidder C Scores
    // Price Score: 50 * (8000/9200) = 43.48
    assert(
      Math.abs(compiledBidC.priceScore - 43.48) <= 0.01,
      `Bidder C Price Score: expected ~43.48, received ${compiledBidC.priceScore}`
    );
    // Lead Time Score: 25 * (20/30) = 16.67
    assert(
      Math.abs(compiledBidC.leadScore - 16.67) <= 0.01,
      `Bidder C Lead Time Score: expected ~16.67, received ${compiledBidC.leadScore}`
    );
    // Terms Score: 100% Advance = 4.00
    assert(
      compiledBidC.termsScore === 4.0,
      `Bidder C Terms Score: expected 4.00, received ${compiledBidC.termsScore}`
    );
    // Vendor Reliability Score: 70 / 10 = 7.00
    assert(
      compiledBidC.vendorScore === 7.0,
      `Bidder C Vendor Score: expected 7.00, received ${compiledBidC.vendorScore}`
    );
    // Composite Total: 43.48 + 16.67 + 4.00 + 7.00 = 71.15
    assert(
      Math.abs(compiledBidC.totalScore - 71.15) <= 0.01,
      `Bidder C Composite Score: expected ~71.15, received ${compiledBidC.totalScore}`
    );

    // 1.4 Assert Winning Recommendation & Anomaly Flags
    assert(
      compiledBidA.isRecommended === true,
      'Bidder A (highest composite score 94.00) is marked isRecommended: true'
    );
    assert(
      compiledBidB.isRecommended === false && compiledBidC.isRecommended === false,
      'Sub-optimal bidders are marked isRecommended: false'
    );
    assert(
      csData.recommendedSupplierId === supplierA._id.toString(),
      `recommendedSupplierId matches winning supplier A ObjectId (${supplierA._id})`
    );

    // Check risk flags on Bidder C (advance terms)
    assert(
      compiledBidC.aiRiskFlags?.includes('CASH_OUTFLOW_RISK'),
      'Bidder C flagged with CASH_OUTFLOW_RISK due to 100% advance TT terms'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 2: GOOGLE GEMINI AI PROCUREMENT SUMMARY ADVISOR
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 2: Google Gemini AI Summary Advisor ---');

    assert(
      typeof csData.aiSummary === 'string' && csData.aiSummary.length > 30,
      'CS document contains generated aiSummary narrative'
    );
    assert(
      csData.aiSummary.includes('Chison Medical') || csData.aiSummary.includes(testProduct.sku),
      'AI narrative contextually identifies recommended vendor or product SKU'
    );

    console.log(`\n[AI Advisor Generated Narrative Sample]:\n"${csData.aiSummary}"\n`);

    // 2.1 Regenerate AI narrative endpoint
    const regenRes = await callApi(
      `/api/v1/erp/procurement/comparative-statements/${csData._id}/generate-ai-summary`,
      'POST',
      {},
      procHeaders
    );

    assert(
      regenRes.status === 200,
      'POST /api/v1/erp/procurement/comparative-statements/:id/generate-ai-summary returns 200 OK'
    );
    assert(
      typeof regenRes.body?.data?.aiSummary === 'string' &&
        regenRes.body?.data?.aiSummary.length > 20,
      'Regenerated AI narrative is present and valid'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 3: CS FINALIZATION & LIFECYCLE LOCK
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 3: Finalization & Lifecycle Control ---');

    // 3.1 Finalize CS via PUT /api/v1/erp/procurement/comparative-statements/:id/finalize
    const finalizeRes = await callApi(
      `/api/v1/erp/procurement/comparative-statements/${csData._id}/finalize`,
      'PUT',
      {},
      procHeaders
    );

    assert(
      finalizeRes.status === 200,
      'PUT /api/v1/erp/procurement/comparative-statements/:id/finalize returns 200 OK'
    );
    assert(
      finalizeRes.body?.data?.status === 'FINALIZED',
      'CS status successfully transitions to FINALIZED'
    );
    assert(
      finalizeRes.body?.data?.approvedBy === procurementStaff._id.toString(),
      'approvedBy user recorded on finalized CS'
    );

    // 3.2 Attempt duplicate finalization (should reject)
    const duplicateFinalizeRes = await callApi(
      `/api/v1/erp/procurement/comparative-statements/${csData._id}/finalize`,
      'PUT',
      {},
      procHeaders
    );

    assert(
      duplicateFinalizeRes.status === 400,
      'Subsequent finalization attempt correctly rejected with 400 Validation Error'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 4: CS RETRIEVAL & FILTERING
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 4: CS Retrieval & Query Endpoints ---');

    // 4.1 Get by ID
    const getByIdRes = await callApi(
      `/api/v1/erp/procurement/comparative-statements/${csData._id}`,
      'GET',
      undefined,
      procHeaders
    );

    assert(getByIdRes.status === 200, 'GET /api/v1/erp/procurement/comparative-statements/:id returns 200 OK');
    assert(
      getByIdRes.body?.data?.productId?.sku === testProduct.sku,
      'GET by ID populates master product details'
    );
    assert(
      getByIdRes.body?.data?.recommendedSupplierId?.supplierCode === `SUP-CHISON-${runId}`,
      'GET by ID populates recommended supplier details'
    );

    // 4.2 List CS with filters
    const listCsRes = await callApi(
      `/api/v1/erp/procurement/comparative-statements?sku=${testProduct.sku}&status=FINALIZED`,
      'GET',
      undefined,
      procHeaders
    );

    assert(listCsRes.status === 200, 'GET /api/v1/erp/procurement/comparative-statements returns 200 OK');
    assert(
      listCsRes.body?.data?.some((c: any) => c.csNumber === csNumber),
      'Filtered CS list returns compiled and finalized CS'
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

runCsVerificationSuite();
