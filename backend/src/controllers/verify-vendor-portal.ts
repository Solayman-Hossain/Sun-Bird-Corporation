import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ProductModel } from '../models/Product';
import { SupplierModel } from '../models/Supplier';
import { RfqModel } from '../models/Rfq';
import { SupplierQuotationModel } from '../models/SupplierQuotation';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { TokenService } from '../services/TokenService';

async function runVendorPortalVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 18: SUPPLIER MASTER & VENDOR PORTAL VERIFICATION SUITE');
  console.log('  (SUPPLIER MASTER, RFQ BROADCAST, AUTHENTICATED BID QUOTATION)');
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

  // Connect to DB
  await connectDatabase();

  // Start internal HTTP server
  const testServer = http.createServer(app);
  await new Promise<void>((resolve) => testServer.listen(0, () => resolve()));
  const port = (testServer.address() as any).port;

  function makeRequest(
    path: string,
    method: string,
    payload?: any,
    headers: Record<string, string> = {}
  ): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: any }> {
    return new Promise((resolve, reject) => {
      const dataStr = payload !== undefined ? JSON.stringify(payload) : '';
      const requestHeaders: Record<string, string> = { ...headers };

      if (dataStr) {
        requestHeaders['Content-Type'] = 'application/json';
        requestHeaders['Content-Length'] = String(Buffer.byteLength(dataStr));
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
          let rawData = '';
          res.on('data', (chunk) => {
            rawData += chunk;
          });
          res.on('end', () => {
            let body: any = null;
            try {
              body = rawData ? JSON.parse(rawData) : null;
            } catch {
              body = rawData;
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body,
            });
          });
        }
      );

      req.on('error', reject);
      if (dataStr) {
        req.write(dataStr);
      }
      req.end();
    });
  }

  try {
    const runId = Date.now().toString().slice(-6);

    // ─── SETUP USERS & ROLES ───
    console.log('--- Setting Up Test Auth & Roles ---');
    const procurementRole = await RoleModel.create({
      roleName: `Procurement Manager ${runId}`,
      slug: `proc_mgr_${runId}`,
      permissions: [
        { module: 'procurement', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
      ],
      isActive: true,
    });

    const procurementStaff = await UserModel.create({
      fullName: `Procurement Lead ${runId}`,
      email: `proc.lead.${runId}@sunbirdcorp.com`,
      mobile: `01711${runId}`,
      userType: 'STAFF',
      roleId: procurementRole._id as Types.ObjectId,
      isActive: true,
    });

    const vendorUser = await UserModel.create({
      fullName: `Vendor Representative ${runId}`,
      email: `vendor.${runId}@chison.com.cn`,
      mobile: `01811${runId}`,
      userType: 'VENDOR',
      isActive: true,
    });

    const procAuthToken = TokenService.generateAccessToken(procurementStaff);
    const procHeaders = { Authorization: `Bearer ${procAuthToken}` };

    const vendorAuthToken = TokenService.generateAccessToken(vendorUser);
    const vendorHeaders = { Authorization: `Bearer ${vendorAuthToken}` };

    // Setup Master Product
    const testProduct = await ProductModel.create({
      sku: `PROD-RFQ-${runId}`,
      nameEn: 'Chison Q9 Color Doppler System',
      nameBn: 'কাইসন কিউ৯ কালার ডপলার',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.12.00',
      baseUom: 'Unit',
      retailPrice: 1250000,
      showroomPrice: 1200000,
      isMedical: true,
      isActive: true,
    });

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 1: ERP SUPPLIER MASTER MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 1: ERP Supplier Master Management ---');

    // 1.1 Create Supplier via POST /api/v1/erp/procurement/suppliers
    const createSupplierRes = await makeRequest(
      '/api/v1/erp/procurement/suppliers',
      'POST',
      {
        supplierCode: `SUP-CHISON-${runId}`,
        companyName: 'Chison Medical Technologies Co., Ltd.',
        contactPerson: 'Chen Wei',
        email: `sales.${runId}@chison.com.cn`,
        phone: '+86-510-85345999',
        address: 'No. 9, Xinhui Ring Road, New District, Wuxi, Jiangsu, China',
        country: 'China',
        currency: 'USD',
        supplierType: 'FOREIGN',
        paymentTerms: '100% Sight LC',
        bankDetails: 'Bank of China, Wuxi Branch',
        swiftCode: 'BKCHCNBJ920',
        aiRiskScore: 15,
      },
      procHeaders
    );

    assert(createSupplierRes.status === 201, 'POST /api/v1/erp/procurement/suppliers returns 201 Created');
    assert(
      createSupplierRes.body?.data?.supplierCode === `SUP-CHISON-${runId}`,
      'Supplier code matches normalized uppercase'
    );
    assert(
      createSupplierRes.body?.data?.swiftCode === 'BKCHCNBJ920',
      'SWIFT code preserved in vendor profile'
    );
    const supplierId = createSupplierRes.body?.data?._id;

    // 1.2 Link Vendor User to Supplier via POST /api/v1/erp/procurement/suppliers/:id/link-user
    const linkUserRes = await makeRequest(
      `/api/v1/erp/procurement/suppliers/${supplierId}/link-user`,
      'POST',
      { userId: vendorUser._id.toString() },
      procHeaders
    );

    assert(linkUserRes.status === 200, 'POST /api/v1/erp/procurement/suppliers/:id/link-user returns 200 OK');
    assert(
      linkUserRes.body?.data?.userId === vendorUser._id.toString(),
      'Supplier successfully linked to portal vendor user'
    );

    // 1.3 List Suppliers via GET /api/v1/erp/procurement/suppliers
    const listSuppliersRes = await makeRequest(
      `/api/v1/erp/procurement/suppliers?country=China&supplierType=FOREIGN`,
      'GET',
      undefined,
      procHeaders
    );

    assert(listSuppliersRes.status === 200, 'GET /api/v1/erp/procurement/suppliers returns 200 OK');
    assert(
      listSuppliersRes.body?.data?.length >= 1 &&
        listSuppliersRes.body?.data[0]?.supplierCode === `SUP-CHISON-${runId}`,
      'Supplier filter by country and type returns matching vendor'
    );

    // 1.4 Update Supplier via PUT /api/v1/erp/procurement/suppliers/:id
    const updateSupplierRes = await makeRequest(
      `/api/v1/erp/procurement/suppliers/${supplierId}`,
      'PUT',
      { paymentTerms: 'LC 60 Days' },
      procHeaders
    );

    assert(updateSupplierRes.status === 200, 'PUT /api/v1/erp/procurement/suppliers/:id returns 200 OK');
    assert(
      updateSupplierRes.body?.data?.paymentTerms === 'LC 60 Days',
      'Supplier payment terms updated'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 2: RFQ BROADCASTING (PROCUREMENT STAFF)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 2: RFQ Tender Broadcasting ---');

    const deadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const broadcastRes = await makeRequest(
      '/api/v1/erp/procurement/rfqs',
      'POST',
      {
        rfqNumber: `RFQ-${runId}-0042`,
        title: 'Tender for 5x Ultrasound Color Doppler Units',
        productId: testProduct._id.toString(),
        targetQuantity: 5,
        deadline,
        invitedSuppliers: [supplierId],
        notes: 'Required delivery within 30 days of LC confirmation',
      },
      procHeaders
    );

    assert(broadcastRes.status === 201, 'POST /api/v1/erp/procurement/rfqs returns 201 Created');
    assert(
      broadcastRes.body?.data?.rfqNumber === `RFQ-${runId}-0042`,
      'RFQ tender created with designated rfqNumber'
    );
    assert(
      broadcastRes.body?.data?.status === 'OPEN',
      'RFQ tender initial status is OPEN'
    );

    // List RFQs via ERP
    const listRfqsRes = await makeRequest(
      '/api/v1/erp/procurement/rfqs',
      'GET',
      undefined,
      procHeaders
    );
    assert(listRfqsRes.status === 200, 'GET /api/v1/erp/procurement/rfqs returns 200 OK');
    assert(
      listRfqsRes.body?.data?.some((r: any) => r.rfqNumber === `RFQ-${runId}-0042`),
      'Broadcasted RFQ appears in ERP tender list'
    );

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 3: AUTHENTICATED VENDOR PORTAL ACTIONS
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 3: Authenticated Vendor Portal Endpoints ---');

    // 3.1 Vendor checks profile via GET /api/v1/portal/vendor/profile
    const vendorProfileRes = await makeRequest(
      '/api/v1/portal/vendor/profile',
      'GET',
      undefined,
      vendorHeaders
    );

    assert(vendorProfileRes.status === 200, 'GET /api/v1/portal/vendor/profile returns 200 OK');
    assert(
      vendorProfileRes.body?.data?.companyName === 'Chison Medical Technologies Co., Ltd.',
      'Vendor profile returns linked company details'
    );
    assert(
      vendorProfileRes.body?.data?.swiftCode === 'BKCHCNBJ920',
      'Vendor profile includes SWIFT code'
    );

    // 3.2 Vendor lists available RFQs via GET /api/v1/portal/vendor/rfqs
    const vendorRfqsRes = await makeRequest(
      '/api/v1/portal/vendor/rfqs',
      'GET',
      undefined,
      vendorHeaders
    );

    assert(vendorRfqsRes.status === 200, 'GET /api/v1/portal/vendor/rfqs returns 200 OK');
    assert(
      vendorRfqsRes.body?.data?.some((r: any) => r.rfqNumber === `RFQ-${runId}-0042`),
      'Vendor can view RFQs where they are invited'
    );

    // 3.3 Submit Bid Quotation via POST /api/v1/portal/vendor/quotations
    const submitBidRes = await makeRequest(
      '/api/v1/portal/vendor/quotations',
      'POST',
      {
        rfqNumber: `RFQ-${runId}-0042`,
        productId: testProduct._id.toString(),
        sku: testProduct.sku,
        quotedUnitPrice: 8500.0,
        currency: 'USD',
        leadTimeDays: 25,
        paymentTerms: '100% Sight LC',
        moq: 1,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      vendorHeaders
    );

    assert(submitBidRes.status === 201, 'POST /api/v1/portal/vendor/quotations returns 201 Created');
    assert(
      submitBidRes.body?.data?.quotedUnitPrice === 8500.0,
      'Bid quotation price saved accurately'
    );
    assert(
      submitBidRes.body?.data?.supplierId === supplierId,
      'Quotation automatically bound to authenticated vendor supplierId'
    );

    // 3.4 Vendor lists own quotations via GET /api/v1/portal/vendor/quotations
    const vendorQuotesRes = await makeRequest(
      '/api/v1/portal/vendor/quotations',
      'GET',
      undefined,
      vendorHeaders
    );

    assert(vendorQuotesRes.status === 200, 'GET /api/v1/portal/vendor/quotations returns 200 OK');
    assert(
      vendorQuotesRes.body?.data?.length >= 1 &&
        vendorQuotesRes.body?.data[0]?.rfqNumber === `RFQ-${runId}-0042`,
      'Vendor can see their submitted quotation in the portal'
    );

    // 3.5 Duplicate bid prevention: submitting second bid for same RFQ should fail with 409 Conflict
    const duplicateBidRes = await makeRequest(
      '/api/v1/portal/vendor/quotations',
      'POST',
      {
        rfqNumber: `RFQ-${runId}-0042`,
        productId: testProduct._id.toString(),
        sku: testProduct.sku,
        quotedUnitPrice: 8200.0,
        currency: 'USD',
        leadTimeDays: 20,
      },
      vendorHeaders
    );

    assert(duplicateBidRes.status === 409, 'Duplicate bid submission for same RFQ returns 409 Conflict');

    // 3.6 ERP procurement officer views quotations via GET /api/v1/erp/procurement/quotations
    const erpQuotesRes = await makeRequest(
      `/api/v1/erp/procurement/quotations?rfqNumber=RFQ-${runId}-0042`,
      'GET',
      undefined,
      procHeaders
    );

    assert(erpQuotesRes.status === 200, 'GET /api/v1/erp/procurement/quotations returns 200 OK');
    assert(
      erpQuotesRes.body?.data?.length === 1 &&
        erpQuotesRes.body?.data[0]?.quotedUnitPrice === 8500.0,
      'ERP procurement officer sees vendor bid quotation in dashboard'
    );
  } finally {
    testServer.close();
    await disconnectDatabase();
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runVendorPortalVerificationSuite().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
