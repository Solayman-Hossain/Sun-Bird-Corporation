import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis } from '../config/redis';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { WarehouseModel } from '../models/Warehouse';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { CustomerModel } from '../models/Customer';
import { CustomerCreditProfileModel } from '../models/CustomerCreditProfile';
import { OrderModel } from '../models/Order';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { TokenService } from '../services/TokenService';
import { PathaoClient } from '../integrations/pathaoClient';
import { SteadfastClient } from '../integrations/steadfastClient';
import { LogisticsController } from './LogisticsController';
import { LogisticsService } from '../services/LogisticsService';

async function runSalesPosLogisticsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 30: SALES, POS & LOGISTICS CONTROLLERS & EXPRESS ROUTES');
  console.log('  (PUBLIC CHECKOUT & AWB TRACKING, POS BILLING, CREDIT PROFILES, CHALLANS)');
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

  // Connect to DB and Redis
  await connectDatabase();
  await connectRedis().catch(() => {});

  // Setup Mock Carrier Clients for deterministic logistics testing
  const mockPathaoClient = new PathaoClient();
  mockPathaoClient.setMockHandler(async (endpoint, options) => {
    if (endpoint === '/aladdin/api/v1/issue-token') {
      return {
        status: 200,
        data: { access_token: 'mock-token-pos', expires_in: 3600 },
      };
    }
    if (endpoint === '/aladdin/api/v1/orders') {
      const parsed = JSON.parse(options.body || '{}');
      return {
        status: 200,
        data: {
          data: {
            consignment_id: `PT-CONS-${parsed.merchant_order_id}`,
            tracking_code: `PT-TRK-${parsed.merchant_order_id}`,
            order_status: 'Pending',
            delivery_fee: 100,
          },
        },
      };
    }
    return { status: 200, data: {} };
  });

  const mockSteadfastClient = new SteadfastClient();
  const testLogisticsService = new LogisticsService(mockPathaoClient, mockSteadfastClient);
  LogisticsController.setLogisticsService(testLogisticsService);

  // Spin up ephemeral HTTP server
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
          let resBody = '';
          res.on('data', (chunk) => (resBody += chunk));
          res.on('end', () => {
            let parsed: any;
            try {
              parsed = JSON.parse(resBody);
            } catch {
              parsed = resBody;
            }
            resolve({
              status: res.statusCode || 500,
              headers: res.headers,
              body: parsed,
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

  const runId = Date.now().toString().slice(-6);

  try {
    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Setup Roles, Users, Warehouse & Product Master Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Showroom Warehouse
    const showroomWarehouse = await WarehouseModel.create({
      name: `Dhanmondi Showroom ${runId}`,
      warehouseCode: `WH-SHW-${runId}`,
      type: 'OUTLET',
      address: 'House 5, Road 27, Dhanmondi, Dhaka',
      district: 'Dhaka',
      isCentralHub: false,
      isActive: true,
    });
    assert(!!showroomWarehouse._id, `Created showroom warehouse: ${showroomWarehouse.name}`);

    // Roles & Staff
    const cashierRole = await RoleModel.create({
      roleName: `Showroom Cashier ${runId}`,
      slug: `cashier_${runId}`,
      permissions: [
        { module: 'pos', actions: ['CREATE', 'READ'] },
        { module: 'sales', actions: ['CREATE', 'READ', 'UPDATE'] },
      ],
      isActive: true,
    });

    const cashierUser = await UserModel.create({
      fullName: `Afzal Hossain ${runId}`,
      email: `cashier.${runId}@sunbirdcorp.com`,
      mobile: `01711${runId}`,
      userType: 'STAFF',
      roleId: cashierRole._id as Types.ObjectId,
      warehouseId: showroomWarehouse._id as Types.ObjectId,
      isActive: true,
    });

    const directorUser = await UserModel.create({
      fullName: `Director Shahadat ${runId}`,
      email: `director.${runId}@sunbirdcorp.com`,
      mobile: `01811${runId}`,
      userType: 'DIRECTOR',
      isActive: true,
    });

    const cashierToken = TokenService.generateAccessToken(cashierUser);
    const cashierHeaders = { Authorization: `Bearer ${cashierToken}` };

    const directorToken = TokenService.generateAccessToken(directorUser);
    const directorHeaders = { Authorization: `Bearer ${directorToken}` };

    // Master Product & Batch for POS & Checkout
    const testSku = `SYR-POS-${runId}`;
    const testProduct = await ProductModel.create({
      sku: testSku,
      nameEn: `Disposable Syringe 5ml Luer Lock ${runId}`,
      nameBn: 'ডিসপোজেবল সিরিঞ্জ ৫ মি.লি.',
      category: 'MEDICAL_DISPOSABLES',
      hsCode: '90183100',
      baseUom: 'PCS',
      retailPrice: 20.0,
      showroomPrice: 20.0,
      isMedical: true,
      isActive: true,
    });

    const testBatch = await ProductBatchModel.create({
      productId: testProduct._id,
      sku: testSku,
      batchNumber: `BAT-POS-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      baseUom: 'PCS',
      currentQty: 100,
      reservedQty: 0,
      unitCost: 10.0,
      warehouseId: showroomWarehouse._id,
      locationStatus: 'ON_HAND',
    });
    assert(testBatch.currentQty === 100, `Created batch with 100 units in showroom warehouse`);

    // Customer Fixture
    const testCustomer = await CustomerModel.create({
      fullName: `Kamal Hossain ${runId}`,
      mobile: `01911${runId}`,
      customerType: 'B2B_HOSPITAL',
      companyName: `City Diagnostic Center ${runId}`,
      buyerBin: '123456789-0101',
      shippingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
      billingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
    });

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify Public E-Commerce Checkout Route (POST /api/v1/public/checkout)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const publicCheckoutPayload = {
      customerName: `Kamal Hossain ${runId}`,
      customerMobile: `01911${runId}`,
      customerEmail: `kamal.${runId}@gmail.com`,
      deliveryAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
      district: 'Dhaka',
      paymentMethod: 'COD',
      items: [
        {
          productId: testProduct._id.toString(),
          sku: testSku,
          productName: testProduct.nameEn,
          quantity: 5,
          unitPrice: 20.0,
          lineTotal: 100.0,
        },
      ],
      shippingFee: 80.0,
      discountAmount: 0.0,
    };

    const checkoutRes = await makeRequest(
      '/api/v1/public/checkout',
      'POST',
      publicCheckoutPayload,
      { 'X-Idempotency-Key': `IDEMP-CHK-${runId}` }
    );

    assert(checkoutRes.status === 201, `Public checkout returned HTTP 201 Created (got ${checkoutRes.status})`);
    assert(checkoutRes.body.success === true, 'Response body success is true');
    assert(!!checkoutRes.body.data.orderNo, `Order created: ${checkoutRes.body.data.orderNo}`);
    assert(checkoutRes.body.data.grandTotal === 195, 'Grand total includes items + 15% VAT + shipping (195 BDT)');

    const publicOrderNo = checkoutRes.body.data.orderNo;
    const publicOrderId = checkoutRes.body.data.orderId;

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify ERP POS Direct Checkout Route (POST /api/v1/erp/pos/checkout)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const posPayload = {
      showroomWarehouseId: showroomWarehouse._id.toString(),
      customerName: 'Dr. Rafiqul Islam',
      customerMobile: `01722${runId}`,
      paymentMethod: 'CASH',
      items: [
        {
          productId: testProduct._id.toString(),
          sku: testSku,
          batchId: testBatch._id.toString(),
          quantity: 10,
          unitPrice: 20.0,
          lineTotal: 200.0,
        },
      ],
      paidAmount: 250.0,
    };

    const posRes = await makeRequest(
      '/api/v1/erp/pos/checkout',
      'POST',
      posPayload,
      { ...cashierHeaders, 'X-Idempotency-Key': `IDEMP-POS-${runId}` }
    );

    assert(posRes.status === 201, `POS checkout returned HTTP 201 Created (got ${posRes.status})`);
    assert(posRes.body.success === true, 'POS response body success is true');
    assert(!!posRes.body.data.invoiceNo, `Generated invoice number: ${posRes.body.data.invoiceNo}`);
    assert(!!posRes.body.data.challanNo, `Generated delivery challan: ${posRes.body.data.challanNo}`);
    assert(posRes.body.data.changeAmount === 20.0, 'Change amount computed correctly (250 paid - 230 grandTotal = 20 BDT)');
    assert(!!posRes.body.data.thermalInvoice, 'Thermal receipt format generated for 80mm ESC/POS printer');

    // Verify batch stock decremented
    const updatedBatch = await ProductBatchModel.findById(testBatch._id);
    assert(updatedBatch?.currentQty === 90, `Batch current stock decremented from 100 to 90 units (got ${updatedBatch?.currentQty})`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify ERP Logistics Booking Route (POST /api/v1/erp/logistics/consignments)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const bookingPayload = {
      orderId: publicOrderId,
      courierProvider: 'PATHAO',
      recipientName: `Kamal Hossain ${runId}`,
      recipientPhone: `01911${runId}`,
      recipientAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
      itemWeightKg: 1.0,
      codAmount: 195.0,
    };

    const logisticsRes = await makeRequest(
      '/api/v1/erp/logistics/consignments',
      'POST',
      bookingPayload,
      cashierHeaders
    );

    assert(logisticsRes.status === 201, `Logistics consignment booking returned HTTP 201 (got ${logisticsRes.status})`);
    assert(logisticsRes.body.success === true, 'Logistics response success is true');
    assert(logisticsRes.body.data.provider === 'PATHAO', 'Courier provider is PATHAO');
    assert(!!logisticsRes.body.data.trackingCode, `Tracking Code assigned: ${logisticsRes.body.data.trackingCode}`);

    const createdTrackingCode = logisticsRes.body.data.trackingCode;

    // Check order status changed to DISPATCHED
    const dispatchedOrder = await OrderModel.findById(publicOrderId);
    assert(dispatchedOrder?.orderStatus === 'DISPATCHED', 'Order status transitioned to DISPATCHED');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify Public Shipment AWB Tracking Route (GET /api/v1/public/track-order/:code)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const trackRes = await makeRequest(
      `/api/v1/public/track-order/${createdTrackingCode}`,
      'GET'
    );

    assert(trackRes.status === 200, `Public track-order returned HTTP 200 OK (got ${trackRes.status})`);
    assert(trackRes.body.success === true, 'Public track-order success is true');
    assert(trackRes.body.data.trackingCode === createdTrackingCode, 'Tracking code matches');
    assert(trackRes.body.data.courierPartner === 'PATHAO', 'Carrier is PATHAO');
    assert(trackRes.body.data.deliveryStatus === 'BOOKED', 'Initial status is BOOKED');

    // Verify sensitive pricing fields are STRICTLY OMITTED
    assert(trackRes.body.data.codAmount === undefined, 'Public tracking strictly omits codAmount');
    assert(trackRes.body.data.courierFee === undefined, 'Public tracking strictly omits courierFee');
    assert(trackRes.body.data.remittanceAmount === undefined, 'Public tracking strictly omits remittanceAmount');
    assert(trackRes.body.data.remittanceId === undefined, 'Public tracking strictly omits remittanceId');

    // Verify name is masked
    assert(trackRes.body.data.recipientName.includes('*'), `Recipient name masked: ${trackRes.body.data.recipientName}`);

    // Verify 404 on nonexistent tracking code
    const invalidTrackRes = await makeRequest(
      '/api/v1/public/track-order/NONEXISTENT-AWB-CODE',
      'GET'
    );
    assert(invalidTrackRes.status === 404, `Invalid tracking code returns HTTP 404 Not Found (got ${invalidTrackRes.status})`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Verify B2B Customer Credit Profile Routes');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 6.1 Update Credit Profile (PUT)
    const updateProfilePayload = {
      creditLimitBDT: 500000.0,
      creditTermDays: 45,
      isCreditLocked: true,
    };
    const updateProfileRes = await makeRequest(
      `/api/v1/erp/sales/credit-profiles/${testCustomer._id}`,
      'PUT',
      updateProfilePayload,
      cashierHeaders
    );
    assert(updateProfileRes.status === 200, `Update credit profile returned HTTP 200 (got ${updateProfileRes.status})`);
    assert(updateProfileRes.body.data.creditLimitBDT === 500000, 'Credit limit updated to 500,000 BDT');
    assert(updateProfileRes.body.data.isCreditLocked === true, 'isCreditLocked set to true');

    // 6.2 Query Credit Profile (GET)
    const getProfileRes = await makeRequest(
      `/api/v1/erp/sales/credit-profiles/${testCustomer._id}`,
      'GET',
      undefined,
      cashierHeaders
    );
    assert(getProfileRes.status === 200, `Get credit profile returned HTTP 200 (got ${getProfileRes.status})`);
    assert(getProfileRes.body.data.creditLimitBDT === 500000, 'Retrieved creditLimitBDT is 500,000');
    assert(getProfileRes.body.data.isCreditLocked === true, 'Retrieved isCreditLocked is true');

    // 6.3 Director Override (POST)
    const overridePayload = {
      reason: 'Urgent emergency medical supply approved by board of directors',
    };
    const overrideRes = await makeRequest(
      `/api/v1/erp/sales/credit-profiles/${testCustomer._id}/override`,
      'POST',
      overridePayload,
      directorHeaders
    );
    assert(overrideRes.status === 200, `Director override returned HTTP 200 (got ${overrideRes.status})`);
    assert(overrideRes.body.data.isCreditLocked === false, 'Credit lock unlocked via Director override');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Verify Delivery Challan & Sales Invoice Routes');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 7.1 Create Challan
    const challanPayload = {
      orderId: publicOrderId,
      customerId: testCustomer._id.toString(),
      items: [
        {
          productId: testProduct._id.toString(),
          sku: testSku,
          productNameEn: testProduct.nameEn,
          productNameBn: testProduct.nameBn,
          hsCode: '90183100',
          batchNumber: `BAT-POS-${runId}`,
          dispatchedQty: 5,
          uom: 'PCS',
          unitPriceBDT: 20.0,
          vatRate: 15.0,
        },
      ],
      vehicleNumber: 'Dhaka Metro-GA-11-2045',
      driverName: 'Abdur Rahim',
      transporterType: 'PATHAO',
    };

    const createChallanRes = await makeRequest(
      '/api/v1/erp/sales/challans',
      'POST',
      challanPayload,
      cashierHeaders
    );
    assert(createChallanRes.status === 201, `Challan creation returned HTTP 201 (got ${createChallanRes.status})`);
    assert(createChallanRes.body.data.mushakForm === 'Mushak-6.3', 'Compliant with Mushak-6.3 form specification');
    const createdChallanNo = createChallanRes.body.data.challanNo;

    // 7.2 Print Mushak-6.3
    const printRes = await makeRequest(
      `/api/v1/erp/sales/challans/${createChallanRes.body.data.challan._id}/print-mushak63`,
      'GET',
      undefined,
      cashierHeaders
    );
    assert(printRes.status === 200, `Print Mushak-6.3 challan returned HTTP 200 (got ${printRes.status})`);
    assert(printRes.body.data.challanNo === createdChallanNo, 'Challan number matches in print endpoint');

    // 7.3 List Orders
    const ordersRes = await makeRequest('/api/v1/erp/sales/orders', 'GET', undefined, cashierHeaders);
    assert(ordersRes.status === 200, `List orders returned HTTP 200 (got ${ordersRes.status})`);
    assert(Array.isArray(ordersRes.body.data) && ordersRes.body.data.length >= 1, 'Orders array returned');

    // 7.4 Get Single Order
    const orderRes = await makeRequest(`/api/v1/erp/sales/orders/${publicOrderId}`, 'GET', undefined, cashierHeaders);
    assert(orderRes.status === 200, `Get order by ID returned HTTP 200 (got ${orderRes.status})`);
    assert(orderRes.body.data.orderNo === publicOrderNo, 'Order number matches');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  8. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      WarehouseModel.deleteMany({ _id: showroomWarehouse._id }),
      RoleModel.deleteMany({ _id: cashierRole._id }),
      UserModel.deleteMany({ _id: { $in: [cashierUser._id, directorUser._id] } }),
      ProductModel.deleteMany({ _id: testProduct._id }),
      ProductBatchModel.deleteMany({ _id: testBatch._id }),
      CustomerModel.deleteMany({ _id: testCustomer._id }),
      CustomerCreditProfileModel.deleteMany({ customerId: testCustomer._id }),
      OrderModel.deleteMany({ _id: publicOrderId }),
      CourierConsignmentModel.deleteMany({ trackingCode: createdTrackingCode }),
    ]);

    assert(true, 'Test fixtures safely removed from database');
  } catch (error: any) {
    console.error('💥 Unhandled exception during sales/pos/logistics verification:', error);
    failed++;
  } finally {
    await new Promise<void>((resolve) => testServer.close(() => resolve()));
    await disconnectRedis().catch(() => {});
    await disconnectDatabase().catch(() => {});
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSalesPosLogisticsVerificationSuite();
