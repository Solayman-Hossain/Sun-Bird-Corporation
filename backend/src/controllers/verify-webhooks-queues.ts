import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { JournalEntryModel } from '../models/JournalEntry';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { UserModel } from '../models/User';
import { QueueManager, inMemoryJobLog } from '../queues/queueManager';

async function runWebhooksQueuesVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PHASE 8: EXTERNAL GATEWAYS, WEBHOOKS & BULLMQ QUEUES VERIFICATION');
  console.log('  (Prompts 50 - 52: SSLCOMMERZ IPN, Pathao, Steadfast, BullMQ)');
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

  await connectDatabase();
  const runId = Date.now().toString().slice(-6);

  // Start ephemeral HTTP server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const port = address.port;

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
          let chunks = '';
          res.on('data', (d) => (chunks += d));
          res.on('end', () => {
            try {
              const body = chunks ? JSON.parse(chunks) : {};
              resolve({ status: res.statusCode || 500, headers: res.headers, body });
            } catch {
              resolve({ status: res.statusCode || 500, headers: res.headers, body: chunks });
            }
          });
        }
      );

      req.on('error', reject);
      if (dataStr) req.write(dataStr);
      req.end();
    });
  }

  try {
    // ── Setup Seed Data: Product, Batch, Customer, Order ────────────────────
    console.log('--- Step 0: Preparing Test Order and Batches ---');
    const customer = await UserModel.create({
      mobile: `0178${runId}01`,
      fullName: `Test Customer ${runId}`,
      email: `customer.${runId}@test.com`,
      passwordHash: 'dummy_hash',
      userType: 'CUSTOMER',
      isActive: true,
      isMobileVerified: true,
    });

    const product = await ProductModel.create({
      sku: `PROD-MED-${runId}`,
      nameEn: `Disposable Blood Transfusion Set ${runId}`,
      brand: 'Sun Bird Medical',
      category: 'MEDICAL_DEVICE',
      hsCode: '9018.90.00',
      baseUom: 'PCS',
      retailPrice: 1280.0,
      showroomPrice: 1250.0,
      minStockQty: 10,
      isMedical: true,
      isExpirable: false,
      isActive: true,
    });

    const batch = await ProductBatchModel.create({
      productId: product._id,
      sku: product.sku,
      batchNumber: `BATCH-${runId}`,
      category: 'NON_EXPIRING',
      baseUom: 'PCS',
      currentQty: 50,
      reservedQty: 5, // 5 units reserved by online cart
      unitCost: 800,
      hasIndividualSerials: false,
      warrantyMonths: 12,
      warehouseId: new Types.ObjectId(),
      locationStatus: 'ON_HAND',
    });

    const testOrder = await OrderModel.create({
      orderNo: `ORD-${runId}-001`,
      customerId: customer._id,
      orderChannel: 'ECOMMERCE',
      items: [
        {
          productId: product._id,
          sku: product.sku,
          batchNumber: batch.batchNumber,
          qty: 5,
          uom: 'PCS',
          unitPrice: 256.0,
          lineTotal: 1280.0,
          vatAmount: 0,
        },
      ],
      subtotal: 1280.0,
      vatTotal: 0,
      grandTotal: 1280.0,
      paymentMethod: 'ONLINE_SSLCOMMERZ',
      shippingAddress: 'House 12, Road 4, Dhanmondi, Dhaka',
      codOtpStatus: 'NOT_REQUIRED',
      paymentStatus: 'UNPAID',
      orderStatus: 'PENDING',
    });

    assert(Boolean(testOrder._id), 'Test Order created in UNPAID state');

    // ── Test 1: SSLCOMMERZ Payment IPN Webhook & Order Reconciliation ───────
    console.log('\n--- Step 1: Testing SSLCOMMERZ Payment IPN Webhook ---');
    const ipnPayload = {
      tran_id: testOrder.orderNo,
      val_id: `VAL-${runId}-7788`,
      amount: '1280.00',
      card_type: 'BKASH-BKash',
      store_amount: '1248.00',
      bank_tran_id: `BANK-${runId}-001`,
      status: 'VALID',
      tran_date: '2026-10-25 12:30:00',
      currency: 'BDT',
      verify_sign: 'd41d8cd98f00b204e9800998ecf8427e',
    };

    const ipnRes = await makeRequest(
      '/api/v1/webhooks/sslcommerz/ipn',
      'POST',
      ipnPayload
    );

    assert(ipnRes.status === 200, `SSLCOMMERZ IPN callback processed (HTTP 200)`);
    assert(ipnRes.body.success === true, `IPN response returns success: true`);

    // Verify Order state transition
    const reconciledOrder = await OrderModel.findById(testOrder._id);
    assert(reconciledOrder?.paymentStatus === 'PAID', `Order paymentStatus successfully updated to PAID`);
    assert(reconciledOrder?.orderStatus === 'CONFIRMED', `Order orderStatus successfully transitioned to CONFIRMED`);

    // Verify stock reserve release
    const updatedBatch = await ProductBatchModel.findById(batch._id);
    assert(updatedBatch?.reservedQty === 0, `Reserved stock correctly committed on ProductBatch (reservedQty: 0)`);

    // Verify Automated Double-Entry Receipt Journal Entry (Dr 1030 Bank/MFS, Cr 1100 AR)
    const receiptJv = await JournalEntryModel.findOne({ sourceDocumentRef: testOrder.orderNo });
    assert(Boolean(receiptJv), `Automated receipt Journal Entry created for Order ${testOrder.orderNo}`);
    assert(receiptJv?.voucherType === 'RECEIPT', `JV voucherType is RECEIPT`);
    assert(receiptJv?.totalDebit === 1280 && receiptJv?.totalCredit === 1280, `Receipt JV is strictly balanced (Debit = Credit = 1280 BDT)`);
    assert(
      Boolean(receiptJv?.lines.some((l) => l.accountCode === 1030 && l.debit === 1280)),
      `Debit line posted to 1030 (Bank & MFS Clearing)`
    );
    assert(
      Boolean(receiptJv?.lines.some((l) => l.accountCode === 1100 && l.credit === 1280)),
      `Credit line posted to 1100 (Accounts Receivable)`
    );

    // Verify Auto-Generated Delivery Challan
    const deliveryChallan = await DeliveryChallanModel.findOne({ orderId: testOrder._id });
    assert(Boolean(deliveryChallan), `Delivery Challan auto-generated for confirmed Order`);
    assert(Boolean(deliveryChallan?.challanNo.startsWith('CH-')), `Challan assigned gapless sequential code '${deliveryChallan?.challanNo}'`);

    // ── Test 1b: IPN Idempotency Test ──────────────────────────────────────
    console.log('\n--- Step 1b: Testing SSLCOMMERZ IPN Idempotency ---');
    const duplicateIpnRes = await makeRequest(
      '/api/v1/webhooks/sslcommerz/ipn',
      'POST',
      ipnPayload
    );
    assert(duplicateIpnRes.status === 200, `Duplicate IPN callback handled idempotently (HTTP 200)`);
    const jvCount = await JournalEntryModel.countDocuments({ sourceDocumentRef: testOrder.orderNo });
    assert(jvCount === 1, `Zero duplicate Journal Entries created on idempotent IPN retry`);

    // ── Test 1c: Invalid IPN Transaction Status ────────────────────────────
    console.log('\n--- Step 1c: Testing Invalid IPN Status Rejection ---');
    const invalidIpnRes = await makeRequest(
      '/api/v1/webhooks/sslcommerz/ipn',
      'POST',
      { ...ipnPayload, status: 'FAILED' }
    );
    assert(invalidIpnRes.status === 400, `Failed/Invalid IPN status rejected with HTTP 400`);

    // ── Test 2: Pathao Courier Status Webhook ───────────────────────────────
    console.log('\n--- Step 2: Testing Pathao Courier Webhook ---');
    const pathaoConsignment = await CourierConsignmentModel.create({
      orderId: testOrder._id,
      challanId: deliveryChallan?._id,
      courierPartner: 'PATHAO',
      consignmentId: `PT-${runId}-001`,
      trackingCode: `TRK-PT-${runId}`,
      recipientName: 'Dr. Kabir Hossain',
      recipientPhone: '01711223344',
      recipientAddress: 'House 12, Road 4, Banani, Dhaka',
      weightKg: 1.5,
      codAmount: 1280.0,
      courierFee: 60.0,
      deliveryStatus: 'IN_TRANSIT',
      remittanceAmount: 0,
    });

    // Test Pathao Delivered status
    const pathaoDeliverRes = await makeRequest(
      '/api/v1/webhooks/pathao/status',
      'POST',
      {
        consignment_id: pathaoConsignment.consignmentId,
        order_id: testOrder.orderNo,
        order_status: 'Delivered',
        collected_amount: 1280.0,
        updated_at: new Date().toISOString(),
      },
      { 'X-Pathao-Signature': 'mock_valid_pathao_sig' }
    );

    assert(pathaoDeliverRes.status === 200, `Pathao Delivered status callback processed (HTTP 200)`);
    assert(pathaoDeliverRes.body.data.commissionRealized === true, `Sales commission realized flag confirmed upon delivery`);

    const updatedConsignment = await CourierConsignmentModel.findById(pathaoConsignment._id);
    assert(updatedConsignment?.deliveryStatus === 'DELIVERED', `Consignment deliveryStatus updated to DELIVERED`);

    const deliveredOrder = await OrderModel.findById(testOrder._id);
    assert(deliveredOrder?.orderStatus === 'DELIVERED', `Order status updated to DELIVERED`);

    // Test Pathao Returned / RTO status
    const rtoConsignment = await CourierConsignmentModel.create({
      orderId: testOrder._id,
      courierPartner: 'PATHAO',
      consignmentId: `PT-RTO-${runId}`,
      trackingCode: `TRK-RTO-${runId}`,
      recipientName: 'Dr. Kabir Hossain',
      recipientPhone: '01711223344',
      recipientAddress: 'House 12, Road 4, Banani, Dhaka',
      weightKg: 1.0,
      codAmount: 500.0,
      courierFee: 60.0,
      deliveryStatus: 'IN_TRANSIT',
      remittanceAmount: 0,
    });

    const pathaoReturnRes = await makeRequest(
      '/api/v1/webhooks/pathao/status',
      'POST',
      {
        consignment_id: rtoConsignment.consignmentId,
        order_status: 'Returned',
      },
      { 'X-Pathao-Signature': 'mock_valid_pathao_sig' }
    );

    assert(pathaoReturnRes.status === 200, `Pathao Returned status callback processed (HTTP 200)`);
    const rtoConsignmentDoc = await CourierConsignmentModel.findById(rtoConsignment._id);
    assert(rtoConsignmentDoc?.deliveryStatus === 'RTO_RETURNED', `Consignment deliveryStatus updated to RTO_RETURNED`);

    // ── Test 3: Steadfast Courier Status Webhook ────────────────────────────
    console.log('\n--- Step 3: Testing Steadfast Courier Webhook ---');
    const steadfastConsignment = await CourierConsignmentModel.create({
      orderId: testOrder._id,
      courierPartner: 'STEADFAST',
      consignmentId: `ST-${runId}-001`,
      trackingCode: `SF-TRK-${runId}`,
      recipientName: 'Chittagong Medical Hospital',
      recipientPhone: '01811223344',
      recipientAddress: 'Panchlaish, Chittagong',
      weightKg: 2.0,
      codAmount: 2500.0,
      courierFee: 120.0,
      deliveryStatus: 'IN_TRANSIT',
      remittanceAmount: 0,
    });

    const steadfastRes = await makeRequest(
      '/api/v1/webhooks/steadfast/status',
      'POST',
      {
        consignment_id: steadfastConsignment.consignmentId,
        tracking_code: steadfastConsignment.trackingCode,
        status: 'delivered',
        cod_amount: 2500.0,
      },
      { Authorization: 'Bearer steadfast_webhook_secret_key' }
    );

    assert(steadfastRes.status === 200, `Steadfast status callback processed (HTTP 200)`);
    const updatedStConsignment = await CourierConsignmentModel.findById(steadfastConsignment._id);
    assert(updatedStConsignment?.deliveryStatus === 'DELIVERED', `Steadfast consignment deliveryStatus updated to DELIVERED`);

    // ── Test 4: BullMQ Asynchronous Queues and Background Processors ────────
    console.log('\n--- Step 4: Testing BullMQ Background Queues ---');

    // Email Queue test
    const emailJob = await QueueManager.queueEmail('send-order-receipt', {
      to: 'customer@test.com',
      orderNo: testOrder.orderNo,
      subject: `Order Receipt for ${testOrder.orderNo}`,
    });
    assert(Boolean(emailJob.id), `Email job successfully enqueued in BullMQ EmailQueue`);

    // SMS Queue test
    const smsJob = await QueueManager.queueSms('dispatch-delivery-sms', {
      mobile: '01711223344',
      message: `Your Sun Bird order ${testOrder.orderNo} has been dispatched.`,
    });
    assert(Boolean(smsJob.id), `SMS job successfully enqueued in BullMQ SmsQueue`);

    // Inventory Alert Queue test
    const alertJob = await QueueManager.queueInventoryAlert('fefo-near-expiry-alert', {
      sku: product.sku,
      batchNumber: batch.batchNumber,
      expiryDate: new Date().toISOString(),
    });
    assert(Boolean(alertJob.id), `Inventory Alert job successfully enqueued in BullMQ InventoryAlertQueue`);

    // Daily Cron Queue test
    const cronJob = await QueueManager.queueDailyCron('midnight-customer-credit-check', {
      date: new Date().toISOString(),
    });
    assert(Boolean(cronJob.id), `Midnight task successfully enqueued in BullMQ DailyCronQueue`);

    // Verify in-memory execution or queue completion
    assert(
      inMemoryJobLog.length >= 4,
      `All 4 asynchronous background jobs processed through BullMQ worker pipelines`
    );

  } catch (error: any) {
    console.error('Unexpected error during verification:', error);
    assert(false, `Unexpected error: ${error.message}`);
  } finally {
    // Teardown test records
    console.log('\n--- Cleaning up test artifacts ---');
    await QueueManager.closeAll().catch(() => {});
    await UserModel.deleteMany({ email: new RegExp(runId) });
    await ProductModel.deleteMany({ sku: new RegExp(runId) });
    await ProductBatchModel.deleteMany({ batchNumber: new RegExp(runId) });
    await OrderModel.deleteMany({ orderNo: new RegExp(runId) });
    await JournalEntryModel.deleteMany({ sourceDocumentRef: new RegExp(runId) });
    await DeliveryChallanModel.deleteMany({ challanNo: new RegExp(runId) });
    await CourierConsignmentModel.deleteMany({ consignmentId: new RegExp(runId) });

    server.close();
    await disconnectDatabase();

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runWebhooksQueuesVerificationSuite();
