import mongoose, { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { OrderModel } from '../models/Order';
import { CustomerModel } from '../models/Customer';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { WarehouseBinModel } from '../models/WarehouseBin';
import { StockLedgerModel } from '../models/StockLedger';
import { OrderReservationModel } from '../models/OrderReservation';
import { PickingSessionModel } from '../models/PickingSession';
import { PackingSessionModel } from '../models/PackingSession';
import { OrderSettingsModel } from '../models/OrderSettings';

import { OrderProcessingService } from './OrderProcessingService';
import { OrderReservationService } from './OrderReservationService';
import { OrderPickingPackingService } from './OrderPickingPackingService';
import { OrderDispatchDeliveryService } from './OrderDispatchDeliveryService';
import { OrderPaymentVerificationService } from './OrderPaymentVerificationService';
import { OrderTimelineReportService } from './OrderTimelineReportService';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runOrderVerification() {
  console.log('\n===============================================================');
  console.log('   SUN BIRD ERP — MODULE 09: ORDER PROCESSING & E-COMMERCE     ');
  console.log('===============================================================\n');

  await connectDatabase();

  const runId = Date.now().toString().slice(-6);
  const testOrgId = new Types.ObjectId();
  const testUserId = new Types.ObjectId();
  let passCount = 0;

  try {
    // ─── STEP 1: TEST MASTER DATA SETUP ──────────────────────────────────────
    console.log('[Step 1] Creating Test Masters (Warehouse, Bins, Product, Batches, Customer)...');

    const warehouse = await WarehouseModel.create({
      organizationId: testOrgId,
      warehouseCode: `WH-ORD-${runId}`,
      name: `Order Fulfillment Center ${runId}`,
      type: 'CENTRAL',
      address: 'Gulshan-2, Dhaka',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });

    const bin = await WarehouseBinModel.create({
      warehouseId: warehouse._id,
      binCode: `BIN-A1-${runId}`,
      zone: 'Zone-A',
      aisle: '01',
      rack: 'R1',
      shelf: 'S1',
      isActive: true,
    });

    const customer = await CustomerModel.create({
      fullName: `Test Retailer ${runId}`,
      mobile: `01799${runId}`,
      customerType: 'RETAIL',
      email: `retailer${runId}@sunbird.com`,
      billingAddress: 'House 12, Road 4, Gulshan-2, Dhaka',
      shippingAddress: 'House 12, Road 4, Gulshan-2, Dhaka',
      isGuest: false,
      isActive: true,
      registeredVia: 'WEB',
    });

    const product = await ProductModel.create({
      sku: `SKU-ORD-${runId}`,
      nameEn: `Sun Bird Enterprise Router ${runId}`,
      nameBn: 'সান বার্ড রাউটার',
      category: 'EXPIRY_CONTROLLED',
      brand: 'Sun Bird',
      unit: 'PCS',
      baseUom: 'PCS',
      retailPrice: 5000,
      defaultSalesPrice: 5000,
      costPrice: 3200,
      vatPercent: 5,
      taxPercent: 5,
      isActive: true,
    });

    // Create 2 batches for FEFO (First Expired First Out)
    const batch1 = await ProductBatchModel.create({
      organizationId: testOrgId,
      warehouseId: warehouse._id,
      binId: bin._id,
      productId: product._id,
      sku: product.sku,
      batchNumber: `BATCH-EARLY-${runId}`,
      currentQty: 20,
      reservedQty: 0,
      unitCost: 3200,
      costPrice: 3200,
      baseUom: 'PCS',
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 30 * 86400000), // expires in 30 days
      status: 'ACTIVE',
    });

    const batch2 = await ProductBatchModel.create({
      organizationId: testOrgId,
      warehouseId: warehouse._id,
      binId: bin._id,
      productId: product._id,
      sku: product.sku,
      batchNumber: `BATCH-LATE-${runId}`,
      currentQty: 30,
      reservedQty: 0,
      unitCost: 3200,
      costPrice: 3200,
      baseUom: 'PCS',
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 180 * 86400000), // expires in 180 days
      status: 'ACTIVE',
    });

    assert(Boolean(warehouse && customer && product && batch1 && batch2), 'Test master records created');
    passCount += 1;
    console.log('  ✓ Warehouse, Customer, Product, and FEFO Batches successfully initialized.');

    // ─── STEP 2: MANUAL SALES ORDER CREATION & PRICING CALCULATION ─────────
    console.log('\n[Step 2] Testing Manual Sales Order Creation with Pricing & Tax...');
    const order = await OrderProcessingService.createManualSalesOrder({
      customerId: (customer._id as Types.ObjectId).toString(),
      organizationId: testOrgId.toString(),
      warehouseId: (warehouse._id as Types.ObjectId).toString(),
      shippingAddress: 'House 12, Road 4, Gulshan-2, Dhaka',
      paymentMethod: 'COD',
      items: [
        {
          productId: (product._id as Types.ObjectId).toString(),
          sku: product.sku,
          uom: 'PCS',
          qty: 15,
          unitPrice: 5000,
          discountAmount: 500, // ৳500 total item discount
          taxRate: 5,
        },
      ],
      shippingCharge: 120,
      orderSource: 'MANUAL',
      notes: 'Urgent priority order for flagship store',
    }, testUserId);

    assert(order.orderNo.length > 5, `Order No generated (got ${order.orderNo})`);
    assert(order.items.length === 1, 'Order has 1 item line');
    // Calculations: 15 * 5000 = 75000 - 500 discount = 74500 taxable. 5% tax = 3725. Grand total = 74500 + 3725 + 120 = 78345
    assert(order.subtotal === 75000, `Subtotal is 75000 (got ${order.subtotal})`);
    assert(order.discountTotal === 500, `Discount total is 500 (got ${order.discountTotal})`);
    assert(order.items[0].taxAmount === 3725, `Tax amount calculated on item: 3725 (got ${order.items[0].taxAmount})`);
    assert(order.shippingCharge === 120, `Shipping is 120 (got ${order.shippingCharge})`);
    assert(order.grandTotal === 78345, `Grand total calculated correctly: 78345 (got ${order.grandTotal})`);
    assert(order.dueAmount === 78345, `Due amount initialized to 78345 (got ${order.dueAmount})`);
    assert(order.orderStatus === 'SUBMITTED', 'Order initial status is SUBMITTED');
    assert(Boolean(order.timeline && order.timeline.length >= 1), 'Initial timeline event logged');
    passCount += 6;
    console.log('  ✓ Order created with exact pricing, tax, discount, and timeline history.');

    // ─── STEP 3: ORDER STATUS TRANSITION MATRIX & STATE MACHINE ─────────────
    console.log('\n[Step 3] Testing Status Transitions & State Machine Validation...');
    // Valid transition: SUBMITTED -> CONFIRMED
    const confirmedOrder = await OrderProcessingService.updateOrderStatus(
      order._id.toString(),
      'CONFIRMED',
      'Customer confirmed order over phone',
      testUserId
    );
    assert(confirmedOrder.orderStatus === 'CONFIRMED', 'Order transitioned to CONFIRMED');
    passCount += 1;

    // Invalid jump transition: CONFIRMED -> DELIVERED (Must reject)
    let invalidJumpCaught = false;
    try {
      await OrderProcessingService.updateOrderStatus(
        order._id.toString(),
        'DELIVERED',
        'Direct skip not allowed',
        testUserId
      );
    } catch (e: any) {
      invalidJumpCaught = true;
    }
    assert(invalidJumpCaught, 'State machine prevented illegal transition jump CONFIRMED -> DELIVERED');
    passCount += 1;
    console.log('  ✓ Status transition matrix and state machine integrity verified.');

    // ─── STEP 4: ORDER HOLD & RELEASE HOLD LIFECYCLE ─────────────────────────
    console.log('\n[Step 4] Testing Order Hold & Release Workflow...');
    const heldOrder = await OrderProcessingService.holdOrder(
      order._id.toString(),
      'Customer requested delay due to warehouse renovation',
      testUserId
    );
    assert(heldOrder.isHold === true, 'Order marked as on hold');
    assert(Boolean(heldOrder.holdReason?.includes('renovation')), 'Hold reason recorded');
    passCount += 2;

    const releasedOrder = await OrderProcessingService.releaseHoldOrder(
      order._id.toString(),
      'Renovation completed, ready to resume workflow',
      testUserId
    );
    assert(releasedOrder.isHold === false, 'Order hold released');
    assert(Boolean(releasedOrder.releaseHoldReason?.includes('completed')), 'Release hold reason recorded');
    passCount += 2;
    console.log('  ✓ Order Hold & Release lifecycle passed.');

    // ─── STEP 5: STOCK AVAILABILITY & FEFO RESERVATION ──────────────────────
    console.log('\n[Step 5] Testing Stock Availability & FEFO Reservation...');
    const stockItems = await OrderReservationService.checkStockAvailability(
      [{ sku: product.sku, warehouseId: (warehouse._id as Types.ObjectId).toString() }]
    );
    assert(stockItems.length === 1, 'Availability checked for item');
    assert(stockItems[0].physicalStock === 50, `Physical stock across batches is 50 (got ${stockItems[0].physicalStock})`);
    assert(stockItems[0].availableStock === 50, `Available stock is 50 (got ${stockItems[0].availableStock})`);
    passCount += 2;

    // Reserve stock for 15 units. FEFO should reserve from batch1 (20 available, expires earlier)
    const { order: reservedOrder, reservation } = await OrderReservationService.reserveOrderStock(
      order._id.toString(),
      (warehouse._id as Types.ObjectId).toString(),
      testUserId
    );

    assert(reservedOrder.orderStatus === 'RESERVED', 'Order status moved to RESERVED upon reservation');
    assert(reservation.status === 'RESERVED', 'Reservation status is RESERVED');
    assert(reservation.items[0].reservedQty === 15, '15 units reserved in reservation item');
    
    // Check batch1 reservedQty
    const updatedBatch1 = await ProductBatchModel.findById(batch1._id);
    assert(updatedBatch1!.reservedQty === 15, `Batch 1 reservedQty updated to 15 (got ${updatedBatch1!.reservedQty})`);
    passCount += 4;
    console.log('  ✓ FEFO Batch reservation succeeded and atomic locks applied.');

    // ─── STEP 6: DUPLICATE RESERVATION PREVENTION ──────────────────────────
    console.log('\n[Step 6] Testing Duplicate Reservation Prevention & Idempotency...');
    const duplicateRes = await OrderReservationService.reserveOrderStock(
      order._id.toString(),
      (warehouse._id as Types.ObjectId).toString(),
      testUserId
    );
    assert(duplicateRes.reservation._id.toString() === reservation._id.toString(), 'Idempotent reserve returns existing reservation');
    const batchCheck = await ProductBatchModel.findById(batch1._id);
    assert(batchCheck!.reservedQty === 15, `Reserved quantity remained unchanged at 15 without double counting (got ${batchCheck!.reservedQty})`);
    passCount += 2;
    console.log('  ✓ Duplicate reservation guard and idempotency validated.');

    // ─── STEP 7: WAREHOUSE PICKING LIST GENERATION & ITEM PICKING ───────────
    console.log('\n[Step 7] Testing Warehouse Picking List Generation & Picking...');
    const pickingSession = await OrderPickingPackingService.createPickingList(
      order._id.toString(),
      (warehouse._id as Types.ObjectId).toString(),
      testUserId,
      'Warehouse Specialist Rafiq'
    );
    assert(pickingSession.status === 'ASSIGNED', 'Picking session assigned');
    assert(pickingSession.items.length === 1, 'Picking session has 1 line item');
    passCount += 2;

    // Pick 15 units
    const pickedSession = await OrderPickingPackingService.updatePickingItem(
      order._id.toString(),
      (pickingSession._id as Types.ObjectId).toString(),
      product.sku,
      15
    );
    assert(pickedSession.items[0].pickedQty === 15, 'Item picked quantity updated to 15');
    passCount += 1;

    // Complete picking
    const completedPickingOrder = await OrderPickingPackingService.completePicking(
      order._id.toString(),
      (pickingSession._id as Types.ObjectId).toString(),
      testUserId
    );
    assert(completedPickingOrder.pickingStatus === 'PICKED', 'Order pickingStatus set to PICKED');
    passCount += 1;
    console.log('  ✓ Warehouse picking lifecycle completed successfully.');

    // ─── STEP 8: PACKING SESSION & MULTI-PACKAGE / CARTON CREATION ──────────
    console.log('\n[Step 8] Testing Packing Session with Multi-Package Generation...');
    const packingSession = await OrderPickingPackingService.createPackingSession(
      order._id.toString(),
      (warehouse._id as Types.ObjectId).toString(),
      testUserId,
      'Packer Kabir',
      [
        {
          packageType: 'CARTON',
          weightKg: 8.5,
          lengthCm: 45,
          widthCm: 30,
          heightCm: 25,
          packagingMaterial: 'Heavy Duty Corrugated Box + Bubble Wrap',
          items: [{ sku: product.sku, productName: product.nameEn, qty: 15 }],
          notes: 'Handled with care, fragile label attached',
        },
      ],
      testUserId
    );
    assert(packingSession.status === 'PACKED', 'Packing session completed with status PACKED');
    assert(packingSession.packages.length === 1, '1 Package carton generated');
    assert(packingSession.packages[0].packageNumber.includes('-PKG-'), 'Package carton has barcode tracking number');
    passCount += 3;
    console.log('  ✓ Packing session and package manifests generated.');

    // ─── STEP 9: DISPATCH ASSIGNMENT & COURIER CONSIGNMENT ───────────────────
    console.log('\n[Step 9] Testing Order Dispatch Management...');
    const dispatchedOrder = await OrderDispatchDeliveryService.createDispatch(
      order._id.toString(),
      {
        deliveryMethod: 'COURIER',
        courierPartner: 'STEADFAST',
        trackingNumber: `ST-${runId}-TRACK`,
        dispatchNotes: 'Handed over to Steadfast courier delivery hub',
      },
      testUserId
    );
    assert(dispatchedOrder.orderStatus === 'DISPATCHED', 'Order status moved to DISPATCHED');
    assert(dispatchedOrder.dispatchStatus === 'DISPATCHED', 'Dispatch status is DISPATCHED');
    assert(dispatchedOrder.deliveryStatus === 'IN_TRANSIT', 'Delivery status is IN_TRANSIT');
    passCount += 3;
    console.log('  ✓ Dispatch assignment and courier tracking registered.');

    // ─── STEP 10: DELIVERY CONFIRMATION & STOCK LEDGER DEDUCTION ────────────
    console.log('\n[Step 10] Testing Delivery Confirmation & Physical Stock Deduction...');
    const deliveredOrder = await OrderDispatchDeliveryService.confirmDelivery(
      order._id.toString(),
      {
        receiverName: 'Md. Tareq Hasan',
        receiverContact: '01799112233',
        notes: 'Signed delivery challan on delivery',
      },
      testUserId
    );
    assert(deliveredOrder.orderStatus === 'DELIVERED', 'Order status is DELIVERED');
    assert(deliveredOrder.deliveryStatus === 'DELIVERED', 'Delivery status is DELIVERED');

    // Verify batch1 stock deduction: currentQty should now be 20 - 15 = 5, reservedQty = 0
    const finalBatch1 = await ProductBatchModel.findById(batch1._id);
    assert(finalBatch1!.currentQty === 5, `Batch 1 currentQty deducted to 5 (got ${finalBatch1!.currentQty})`);
    assert(finalBatch1!.reservedQty === 0, `Batch 1 reservedQty cleared to 0 (got ${finalBatch1!.reservedQty})`);

    // Verify StockLedger entry was recorded
    const ledgerEntry = await StockLedgerModel.findOne({
      referenceNo: order.orderNo,
      movementType: 'DISPATCH',
    });
    assert(ledgerEntry !== null, 'StockLedger DISPATCH entry created');
    assert(ledgerEntry!.qtyChange === -15, `StockLedger recorded qtyChange: -15 (got ${ledgerEntry?.qtyChange})`);

    // Verify OrderReservation marked as FULFILLED
    const finalReservation = await OrderReservationModel.findOne({ orderId: order._id });
    assert(finalReservation?.status === 'FULFILLED', 'OrderReservation marked as FULFILLED');
    passCount += 6;
    console.log('  ✓ Delivery confirmed: Physical inventory permanently deducted and ledger posted.');

    // ─── STEP 11: PAYMENT RECORDING & VERIFICATION ──────────────────────────
    console.log('\n[Step 11] Testing Customer Payment Recording & Verification...');
    // Customer pays ৳40,000 via bKash
    const orderWithPayment = await OrderPaymentVerificationService.recordOrderPayment(
      order._id.toString(),
      {
        paymentMethod: 'BKASH',
        amount: 40000,
        transactionRef: `TRX-BK-${runId}`,
        notes: 'Advance bKash payment',
      },
      testUserId
    );
    assert(orderWithPayment.paymentRecords?.length === 1, 'Payment record added');
    const paymentNumber = orderWithPayment.paymentRecords![0].paymentNumber;
    assert(orderWithPayment.paymentRecords![0].status === 'PENDING', 'Payment record is PENDING verification');
    passCount += 2;

    // Accounts specialist verifies the payment
    const verifiedOrder = await OrderPaymentVerificationService.verifyOrderPayment(
      order._id.toString(),
      paymentNumber,
      testUserId
    );
    assert(verifiedOrder.paidAmount === 40000, `Paid amount updated to 40000 (got ${verifiedOrder.paidAmount})`);
    assert(verifiedOrder.dueAmount === 38345, `Due amount is 38345 (got ${verifiedOrder.dueAmount})`);
    assert(verifiedOrder.paymentStatus === 'PARTIAL', 'Payment status is PARTIAL');
    passCount += 3;
    console.log('  ✓ Payment recording and verification workflow validated.');

    // ─── STEP 12: COD COLLECTION & SETTLEMENT ──────────────────────────────
    console.log('\n[Step 12] Testing COD Cash Collection & Settlement...');
    // Courier collects remaining ৳38,345
    const codOrder = await OrderPaymentVerificationService.recordCodCollection(
      order._id.toString(),
      {
        collectionAmount: 38345,
        collectionDate: new Date(),
        depositDate: new Date(),
        depositAccount: 101001,
        notes: 'Steadfast remit #9921',
      },
      testUserId
    );
    assert(codOrder.paidAmount === 78345, `Paid amount fully settled to 78345 (got ${codOrder.paidAmount})`);
    assert(codOrder.dueAmount === 0, `Due amount is 0 (got ${codOrder.dueAmount})`);
    assert(codOrder.paymentStatus === 'PAID', 'Payment status updated to PAID');
    assert(codOrder.codStatus === 'DEPOSITED', 'COD status updated to DEPOSITED');
    passCount += 4;
    console.log('  ✓ COD cash collection and account deposit settlement confirmed.');

    // ─── STEP 13: DELIVERY CHALLAN & SALES INVOICE GENERATION ───────────────
    console.log('\n[Step 13] Testing Delivery Challan & Sales Invoice Generation...');
    const challan = await OrderDispatchDeliveryService.createDeliveryChallanForOrder(
      order._id.toString(),
      testUserId,
      testOrgId.toString()
    );
    assert(challan.challanNo.startsWith('CH-'), `Challan No generated (got ${challan.challanNo})`);
    passCount += 1;

    const invoice = await OrderDispatchDeliveryService.createSalesInvoiceForOrder(
      order._id.toString(),
      testUserId,
      testOrgId.toString()
    );
    assert(invoice.invoiceNo.startsWith('INV-'), `Sales Invoice No generated (got ${invoice.invoiceNo})`);
    assert(invoice.grandTotal === 78345, `Invoice grandTotal matches order: 78345 (got ${invoice.grandTotal})`);
    passCount += 2;
    console.log('  ✓ Delivery Challan and Sales Invoice auto-generated with counter sequences.');

    // ─── STEP 14: ORDER CANCELLATION & RESERVATION RELEASE TEST ────────────
    console.log('\n[Step 14] Testing Order Cancellation & Reservation Release...');
    // Create another order and reserve 5 units from batch2
    const cancelTestOrder = await OrderProcessingService.createManualSalesOrder({
      customerId: (customer._id as Types.ObjectId).toString(),
      organizationId: testOrgId.toString(),
      warehouseId: (warehouse._id as Types.ObjectId).toString(),
      shippingAddress: 'House 12, Road 4, Gulshan-2, Dhaka',
      paymentMethod: 'COD',
      items: [
        {
          productId: (product._id as Types.ObjectId).toString(),
          sku: product.sku,
          uom: 'PCS',
          qty: 5,
          unitPrice: 5000,
        },
      ],
      orderSource: 'ONLINE',
    }, testUserId);

    await OrderReservationService.reserveOrderStock(
      cancelTestOrder._id.toString(),
      (warehouse._id as Types.ObjectId).toString(),
      testUserId
    );

    const b1Before = await ProductBatchModel.findById(batch1._id);
    assert(b1Before!.reservedQty === 5, `Batch 1 FEFO reserved remaining 5 units (got ${b1Before!.reservedQty})`);

    // Now cancel the order
    const cancelledOrder = await OrderProcessingService.cancelOrder(
      cancelTestOrder._id.toString(),
      'Customer changed mind before dispatch',
      testUserId
    );
    assert(cancelledOrder.orderStatus === 'CANCELLED', 'Order status is CANCELLED');

    const b1After = await ProductBatchModel.findById(batch1._id);
    assert(b1After!.reservedQty === 0, `Batch 1 reservedQty auto-released to 0 (got ${b1After!.reservedQty})`);
    passCount += 3;
    console.log('  ✓ Order Cancellation cleanly restored reserved stock to available inventory.');

    // ─── STEP 15: TIMELINE, REPORTS, PUBLIC TRACKING & SETTINGS ────────────
    console.log('\n[Step 15] Testing Timeline, Reports, Public Tracking & Organization Settings...');
    const timeline = await OrderTimelineReportService.getOrderTimeline(order._id.toString());
    assert(timeline.length >= 6, `Chronological timeline events logged (got ${timeline.length})`);
    passCount += 1;

    const publicTracking = await OrderTimelineReportService.trackOrderCustomerFacing(order.orderNo);
    assert(publicTracking.orderNumber === order.orderNo, 'Public tracking returns orderNumber');
    assert(typeof publicTracking.maskedCustomerName === 'string', 'Public tracking protects customer privacy with masking');
    passCount += 2;

    const report = await OrderTimelineReportService.getOrderReports('FULFILLMENT', {
      organizationId: testOrgId.toString(),
    });
    assert(Array.isArray(report.picking), 'Fulfillment report returned metrics');
    passCount += 1;

    const dashboard = await OrderProcessingService.getOrderDashboard({
      organizationId: testOrgId.toString(),
    });
    assert(dashboard.kpiCards.totalOrders >= 2, `Dashboard KPIs aggregated (total: ${dashboard.kpiCards.totalOrders})`);
    passCount += 1;

    const settings = await OrderTimelineReportService.updateOrderSettings({
      allowPartialDelivery: true,
      autoReserveOnConfirm: true,
      approvalThresholdAmount: 50000,
    }, testOrgId.toString());
    assert(settings.allowPartialDelivery === true, 'Order settings updated');
    passCount += 1;
    console.log('  ✓ Dashboard aggregations, public tracking, and organization settings verified.');

    console.log('\n===============================================================');
    console.log(`  SUCCESS: ALL ${passCount} ORDER PROCESSING VERIFICATION ASSERTIONS PASSED!`);
    console.log('===============================================================\n');
  } catch (error: any) {
    console.error('\n❌ ORDER PROCESSING VERIFICATION FAILED:');
    console.error(error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runOrderVerification();
