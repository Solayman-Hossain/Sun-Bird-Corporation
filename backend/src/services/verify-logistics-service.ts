import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { CustomerModel } from '../models/Customer';
import { OrderModel } from '../models/Order';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { PathaoClient } from '../integrations/pathaoClient';
import { SteadfastClient } from '../integrations/steadfastClient';
import { LogisticsService } from './LogisticsService';
import { NotFoundError, ValidationError, GatewayError } from '../errors/AppError';

async function runLogisticsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 29: COURIER LOGISTICS SERVICE (PATHAO & STEADFAST CLIENTS & AWB)');
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

  const suffix = Date.now().toString().slice(-6);

  // Setup mock clients
  const mockPathaoClient = new PathaoClient({
    baseUrl: 'https://courier-api-sandbox.pathao.com',
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    username: 'test@sunbirdcorp.com',
    password: 'test-password',
    storeId: '1',
  });

  const mockSteadfastClient = new SteadfastClient({
    baseUrl: 'https://portal.steadfast.com.bd/api/v1',
    apiKey: 'test-api-key',
    secretKey: 'test-secret-key',
  });

  // Track mock calls
  const mockCalls: { pathao: string[]; steadfast: string[] } = {
    pathao: [],
    steadfast: [],
  };

  mockPathaoClient.setMockHandler(async (endpoint, options) => {
    mockCalls.pathao.push(endpoint);

    if (endpoint === '/aladdin/api/v1/issue-token') {
      return {
        status: 200,
        data: {
          token_type: 'Bearer',
          expires_in: 3600,
          access_token: 'mock-pathao-access-token-12345',
          refresh_token: 'mock-pathao-refresh-token',
        },
      };
    }

    if (endpoint === '/aladdin/api/v1/merchant/price-plan') {
      const parsed = JSON.parse(options.body || '{}');
      return {
        status: 200,
        data: {
          data: {
            price: parsed.item_weight > 1 ? 160 : 100,
            plan_id: 101,
          },
        },
      };
    }

    if (endpoint === '/aladdin/api/v1/orders') {
      const parsed = JSON.parse(options.body || '{}');
      return {
        status: 200,
        data: {
          type: 'success',
          message: 'Order created successfully',
          data: {
            consignment_id: `PT-CONS-${parsed.merchant_order_id}`,
            tracking_code: `PT-AWB-${parsed.merchant_order_id}`,
            order_status: 'Pending',
            delivery_fee: 120,
          },
        },
      };
    }

    return { status: 404, data: { message: 'Not found' } };
  });

  mockSteadfastClient.setMockHandler(async (endpoint, options) => {
    mockCalls.steadfast.push(endpoint);

    if (endpoint === '/create_order') {
      const parsed = JSON.parse(options.body || '{}');
      return {
        status: 200,
        data: {
          status: 200,
          message: 'Order created successfully',
          consignment: {
            consignment_id: `99${Date.now().toString().slice(-4)}`,
            invoice: parsed.invoice,
            tracking_code: `ST-AWB-${parsed.invoice}`,
            recipient_name: parsed.recipient_name,
            recipient_phone: parsed.recipient_phone,
            recipient_address: parsed.recipient_address,
            cod_amount: parsed.cod_amount,
            status: 'in_review',
            delivery_fee: 100,
          },
        },
      };
    }

    if (endpoint.startsWith('/status_by_trackingcode/')) {
      return {
        status: 200,
        data: {
          status: 200,
          delivery_status: 'in_transit',
        },
      };
    }

    return { status: 404, data: { message: 'Not found' } };
  });

  const testLogisticsService = new LogisticsService(mockPathaoClient, mockSteadfastClient);

  try {
    await connectDatabase().catch(() => {});

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. PathaoClient Integration Tests (OAuth, Price Plan, Create Order)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 1.1 Issue Token
    const token = await mockPathaoClient.issueToken();
    assert(token === 'mock-pathao-access-token-12345', 'PathaoClient issued OAuth Bearer token');
    assert(mockCalls.pathao.includes('/aladdin/api/v1/issue-token'), 'Endpoint /aladdin/api/v1/issue-token called');

    // 1.2 Token Caching (should not call endpoint again)
    const callsCountBefore = mockCalls.pathao.filter((e) => e === '/aladdin/api/v1/issue-token').length;
    const cachedToken = await mockPathaoClient.issueToken();
    const callsCountAfter = mockCalls.pathao.filter((e) => e === '/aladdin/api/v1/issue-token').length;
    assert(cachedToken === token && callsCountBefore === callsCountAfter, 'PathaoClient reuses cached token before expiry');

    // 1.3 Calculate Shipping Fee
    const priceRes = await mockPathaoClient.calculateShippingFee({
      item_weight: 1.5,
      recipient_city: 1,
      recipient_zone: 2,
    });
    assert(priceRes.price === 160, `Pathao calculated delivery fee correctly (expected 160, got ${priceRes.price})`);

    // 1.4 Create Order
    const pathaoOrder = await mockPathaoClient.createOrder({
      merchant_order_id: `ORD-TEST-${suffix}-P1`,
      recipient_name: 'Kamal Hossain',
      recipient_phone: '01911000002',
      recipient_address: 'House 12, Road 5, Dhanmondi, Dhaka',
      recipient_city: 1,
      recipient_zone: 1,
      item_weight: 1.5,
      amount_to_collect: 1280,
    });
    assert(pathaoOrder.consignmentId === `PT-CONS-ORD-TEST-${suffix}-P1`, 'Pathao returned consignmentId');
    assert(pathaoOrder.trackingCode === `PT-AWB-ORD-TEST-${suffix}-P1`, 'Pathao returned trackingCode');
    assert(pathaoOrder.deliveryFee === 120, 'Pathao returned deliveryFee: 120');

    // 1.5 Pathao Error Handling
    mockPathaoClient.setMockHandler(async () => ({
      status: 503,
      data: { message: 'Pathao Service Unavailable' },
    }));
    let pathaoErrorCaught = false;
    try {
      await mockPathaoClient.createOrder({
        merchant_order_id: 'FAIL-ORD',
        recipient_name: 'Fail',
        recipient_phone: '017',
        recipient_address: 'Dhaka',
        recipient_city: 1,
        recipient_zone: 1,
        item_weight: 1,
        amount_to_collect: 0,
      });
    } catch (err: any) {
      if (err instanceof GatewayError && err.statusCode === 502) {
        pathaoErrorCaught = true;
      }
    }
    assert(pathaoErrorCaught, 'PathaoClient maps carrier error to GatewayError (HTTP 502)');

    // Restore working handler
    mockPathaoClient.setMockHandler(async (endpoint, options) => {
      if (endpoint === '/aladdin/api/v1/issue-token') {
        return {
          status: 200,
          data: { access_token: 'mock-pathao-token', expires_in: 3600 },
        };
      }
      if (endpoint === '/aladdin/api/v1/orders') {
        const parsed = JSON.parse(options.body || '{}');
        return {
          status: 200,
          data: {
            data: {
              consignment_id: `PT-CONS-${parsed.merchant_order_id}`,
              tracking_code: `PT-AWB-${parsed.merchant_order_id}`,
              order_status: 'Pending',
              delivery_fee: 120,
            },
          },
        };
      }
      return { status: 200, data: { price: 100 } };
    });

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  2. SteadfastClient Integration Tests (Create Order, Track Status)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 2.1 Create Order
    const sfOrder = await mockSteadfastClient.createOrder({
      invoice: `ORD-TEST-${suffix}-S1`,
      recipient_name: 'Dr. Rafiqul Islam',
      recipient_phone: '01819000001',
      recipient_address: 'Chittagong Medical College Hospital',
      cod_amount: 3500,
      note: 'Medical Diagnostic Reagents - Keep upright',
    });
    assert(!!sfOrder.consignmentId, `Steadfast returned consignmentId: ${sfOrder.consignmentId}`);
    assert(sfOrder.trackingCode === `ST-AWB-ORD-TEST-${suffix}-S1`, 'Steadfast returned trackingCode');
    assert(sfOrder.status === 'in_review', 'Steadfast order status is in_review');

    // 2.2 Track Status
    const sfTrack = await mockSteadfastClient.trackStatus(`ST-AWB-ORD-TEST-${suffix}-S1`);
    assert(sfTrack.deliveryStatus === 'in_transit', 'Steadfast tracked delivery status: in_transit');

    // 2.3 Steadfast Error Handling
    mockSteadfastClient.setMockHandler(async () => ({
      status: 401,
      data: { message: 'Invalid API Key' },
    }));
    let sfErrorCaught = false;
    try {
      await mockSteadfastClient.createOrder({
        invoice: 'FAIL-SF',
        recipient_name: 'Fail',
        recipient_phone: '018',
        recipient_address: 'CTG',
        cod_amount: 0,
      });
    } catch (err: any) {
      if (err instanceof GatewayError && err.statusCode === 502) {
        sfErrorCaught = true;
      }
    }
    assert(sfErrorCaught, 'SteadfastClient maps carrier error to GatewayError (HTTP 502)');

    // Restore working handler
    mockSteadfastClient.setMockHandler(async (endpoint, options) => {
      if (endpoint === '/create_order') {
        const parsed = JSON.parse(options.body || '{}');
        return {
          status: 200,
          data: {
            consignment: {
              consignment_id: `ST99${Date.now().toString().slice(-4)}`,
              invoice: parsed.invoice,
              tracking_code: `ST-AWB-${parsed.invoice}`,
              status: 'in_review',
              delivery_fee: 100,
            },
          },
        };
      }
      return { status: 200, data: { delivery_status: 'in_transit' } };
    });

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  3. Seed Test Order & Customer Fixtures in MongoDB');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Create Customer
    const testCustomer = await CustomerModel.create({
      fullName: `Kamal Hossain ${suffix}`,
      mobile: `01911${suffix}`,
      customerType: 'RETAIL',
      shippingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
      billingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
    });
    assert(!!testCustomer._id, `Created test customer: ${testCustomer.fullName}`);

    // Create Order 1 (For Pathao dispatch)
    const testOrderPathao = await OrderModel.create({
      orderNo: `ORD-PTH-${suffix}`,
      customerId: testCustomer._id,
      orderChannel: 'ECOMMERCE',
      items: [
        {
          productId: new Types.ObjectId(),
          sku: `MED-SYR-${suffix}`,
          qty: 2,
          uom: 'BOX',
          unitPrice: 600,
          lineTotal: 1200,
          vatAmount: 80,
        },
      ],
      subtotal: 1200,
      vatTotal: 80,
      grandTotal: 1280,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      orderStatus: 'PENDING',
      shippingAddress: 'House 12, Road 5, Dhanmondi, Dhaka',
    });
    assert(testOrderPathao.orderStatus === 'PENDING', `Created order for Pathao: ${testOrderPathao.orderNo} (status: PENDING)`);

    // Create DeliveryChallan for Order 1
    const testChallan = await DeliveryChallanModel.create({
      challanNo: `CH-2026-${suffix}`,
      orderId: testOrderPathao._id,
      customerId: testCustomer._id,
      companyBin: '000000000-0201',
      dispatchTime: new Date(),
      transporterType: 'THIRD_PARTY',
      cartonCount: 1,
      items: [
        {
          productId: testOrderPathao.items[0].productId,
          sku: testOrderPathao.items[0].sku,
          productName: 'Disposable Syringe 5ml',
          hsCode: '90183100',
          batchNumber: `BAT-${suffix}`,
          dispatchedQty: 2,
          uom: 'BOX',
          dispatchedSerials: [],
          vatRate: 15,
          sdRate: 0,
        },
      ],
      status: 'APPROVED',
      preparedBy: new Types.ObjectId(),
    });
    assert(testChallan.status === 'APPROVED', `Created DeliveryChallan ${testChallan.challanNo} (status: APPROVED)`);

    // Create Order 2 (For Steadfast dispatch)
    const testOrderSteadfast = await OrderModel.create({
      orderNo: `ORD-STF-${suffix}`,
      customerId: testCustomer._id,
      orderChannel: 'ECOMMERCE',
      items: [
        {
          productId: new Types.ObjectId(),
          sku: `ELEC-MON-${suffix}`,
          qty: 1,
          uom: 'PCS',
          unitPrice: 3200,
          lineTotal: 3200,
          vatAmount: 300,
        },
      ],
      subtotal: 3200,
      vatTotal: 300,
      grandTotal: 3500,
      paymentMethod: 'COD',
      paymentStatus: 'UNPAID',
      orderStatus: 'PENDING',
      shippingAddress: 'Plot 4, Mirpur 10, Dhaka',
    });
    assert(testOrderSteadfast.orderStatus === 'PENDING', `Created order for Steadfast: ${testOrderSteadfast.orderNo} (status: PENDING)`);

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  4. Test dispatchOrderToCourier via PATHAO');
    console.log('────────────────────────────────────────────────────────────────────────');

    const pathaoDispatchResult = await testLogisticsService.dispatchOrderToCourier(
      testOrderPathao._id.toString(),
      'PATHAO'
    );

    assert(pathaoDispatchResult.success === true, 'Pathao dispatch returned success: true');
    assert(pathaoDispatchResult.provider === 'PATHAO', 'Courier provider is PATHAO');
    assert(pathaoDispatchResult.consignmentId === `PT-CONS-${testOrderPathao.orderNo}`, 'Consignment ID matches');
    assert(pathaoDispatchResult.trackingCode === `PT-AWB-${testOrderPathao.orderNo}`, 'Tracking Code (AWB) matches');
    assert(pathaoDispatchResult.deliveryStatus === 'BOOKED', 'Consignment initial status is BOOKED');

    // Verify database updates
    const savedPathaoConsignment = await CourierConsignmentModel.findOne({ orderId: testOrderPathao._id });
    assert(!!savedPathaoConsignment, 'CourierConsignment record created in courier_consignments collection');
    assert(savedPathaoConsignment?.courierPartner === 'PATHAO', 'courierPartner in DB is PATHAO');
    assert(savedPathaoConsignment?.codAmount === 1280, 'COD amount recorded as 1280 BDT');
    assert(savedPathaoConsignment?.challanId?.toString() === testChallan._id.toString(), 'Linked to DeliveryChallan');

    const updatedOrderPathao = await OrderModel.findById(testOrderPathao._id);
    assert(updatedOrderPathao?.orderStatus === 'DISPATCHED', 'Order status transitioned to DISPATCHED');

    const updatedChallan = await DeliveryChallanModel.findById(testChallan._id);
    assert(updatedChallan?.status === 'DISPATCHED', 'DeliveryChallan status transitioned to DISPATCHED');
    assert(updatedChallan?.consignmentTrackingId === savedPathaoConsignment?.trackingCode, 'Challan consignmentTrackingId updated with AWB');
    assert(updatedChallan?.transporterType === 'PATHAO', 'Challan transporterType set to PATHAO');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  5. Test dispatchOrderToCourier via STEADFAST');
    console.log('────────────────────────────────────────────────────────────────────────');

    const sfDispatchResult = await testLogisticsService.dispatchOrderToCourier(
      testOrderSteadfast._id.toString(),
      'STEADFAST'
    );

    assert(sfDispatchResult.success === true, 'Steadfast dispatch returned success: true');
    assert(sfDispatchResult.provider === 'STEADFAST', 'Courier provider is STEADFAST');
    assert(sfDispatchResult.trackingCode === `ST-AWB-${testOrderSteadfast.orderNo}`, 'Tracking Code (AWB) matches Steadfast format');

    const savedSfConsignment = await CourierConsignmentModel.findOne({ orderId: testOrderSteadfast._id });
    assert(!!savedSfConsignment, 'CourierConsignment record saved for Steadfast');
    assert(savedSfConsignment?.courierPartner === 'STEADFAST', 'Consignment courierPartner is STEADFAST');
    assert(savedSfConsignment?.codAmount === 3500, 'Consignment codAmount is 3500 BDT');

    const updatedOrderSteadfast = await OrderModel.findById(testOrderSteadfast._id);
    assert(updatedOrderSteadfast?.orderStatus === 'DISPATCHED', 'Steadfast Order status transitioned to DISPATCHED');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  6. Test trackShipmentPublic (AWB Tracking Without Sensitive Pricing)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const trackingCode = pathaoDispatchResult.trackingCode;
    const publicTrack = await testLogisticsService.trackShipmentPublic(trackingCode);

    assert(publicTrack.success === true, 'trackShipmentPublic returns success: true');
    assert(publicTrack.trackingCode === trackingCode, `Public tracking code matches: ${trackingCode}`);
    assert(publicTrack.courierPartner === 'PATHAO', 'Courier partner returned: PATHAO');
    assert(publicTrack.deliveryStatus === 'BOOKED', 'Delivery status returned: BOOKED');
    assert(publicTrack.orderNo === testOrderPathao.orderNo, `Order number returned: ${publicTrack.orderNo}`);

    // Verify sensitive pricing details are STRICTLY OMITTED
    assert((publicTrack as any).codAmount === undefined, 'Sensitive field "codAmount" is OMITTED from public tracking');
    assert((publicTrack as any).courierFee === undefined, 'Sensitive field "courierFee" is OMITTED from public tracking');
    assert((publicTrack as any).remittanceAmount === undefined, 'Sensitive field "remittanceAmount" is OMITTED from public tracking');
    assert((publicTrack as any).remittanceId === undefined, 'Sensitive field "remittanceId" is OMITTED from public tracking');

    // Verify recipient name is masked for privacy
    assert(publicTrack.recipientName.includes('*'), `Recipient name masked for privacy (got: ${publicTrack.recipientName})`);

    // Verify timeline events
    assert(Array.isArray(publicTrack.timeline) && publicTrack.timeline.length >= 4, 'Timeline has chronological stages');
    const bookedStep = publicTrack.timeline.find((t) => t.status === 'BOOKED');
    assert(bookedStep?.completed === true, 'Stage BOOKED is completed: true');

    // Test invalid tracking code
    let notFoundCaught = false;
    try {
      await testLogisticsService.trackShipmentPublic('INVALID-AWB-99999');
    } catch (err: any) {
      if (err instanceof NotFoundError && err.statusCode === 404) {
        notFoundCaught = true;
      }
    }
    assert(notFoundCaught, 'trackShipmentPublic throws NotFoundError on invalid AWB code');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  7. Test Idempotency and Guard Rails');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Re-dispatching already dispatched order should return existing consignment
    const reDispatch = await testLogisticsService.dispatchOrderToCourier(
      testOrderPathao._id.toString(),
      'PATHAO'
    );
    assert(reDispatch.success === true, 'Re-dispatching already dispatched order succeeds');
    assert(reDispatch.consignmentId === pathaoDispatchResult.consignmentId, 'Existing consignment returned idempotently');

    // Dispatching CANCELLED order should throw ValidationError
    testOrderSteadfast.orderStatus = 'CANCELLED';
    await testOrderSteadfast.save();
    let cancelledErrorCaught = false;
    try {
      await testLogisticsService.dispatchOrderToCourier(testOrderSteadfast._id.toString(), 'STEADFAST');
    } catch (err: any) {
      if (err instanceof ValidationError) {
        cancelledErrorCaught = true;
      }
    }
    assert(cancelledErrorCaught, 'dispatchOrderToCourier throws ValidationError on CANCELLED order');

    // Dispatching non-existent order should throw NotFoundError
    let nonExistentCaught = false;
    try {
      await testLogisticsService.dispatchOrderToCourier(new Types.ObjectId().toString(), 'PATHAO');
    } catch (err: any) {
      if (err instanceof NotFoundError) {
        nonExistentCaught = true;
      }
    }
    assert(nonExistentCaught, 'dispatchOrderToCourier throws NotFoundError on non-existent order');

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  8. Teardown Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      CustomerModel.deleteMany({ _id: testCustomer._id }),
      OrderModel.deleteMany({ _id: { $in: [testOrderPathao._id, testOrderSteadfast._id] } }),
      DeliveryChallanModel.deleteMany({ _id: testChallan._id }),
      CourierConsignmentModel.deleteMany({
        orderId: { $in: [testOrderPathao._id, testOrderSteadfast._id] },
      }),
    ]);
    assert(true, 'Test fixtures safely removed from database');
  } catch (error: any) {
    console.error('💥 Unhandled exception during logistics service verification:', error);
    failed++;
  } finally {
    await disconnectDatabase().catch(() => {});
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runLogisticsVerificationSuite();
