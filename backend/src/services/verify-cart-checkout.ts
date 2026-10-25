import { Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { connectRedis, disconnectRedis, get as redisGet, ttl as redisTtl } from '../config/redis';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { WarehouseModel } from '../models/Warehouse';
import { CustomerModel } from '../models/Customer';
import { OrderModel } from '../models/Order';
import { CourierConsignmentModel } from '../models/CourierConsignment';
import { IdempotencyKeyModel } from '../models/IdempotencyKey';
import { CartCheckoutService, CheckoutDTO } from './CartCheckoutService';
import { InsufficientStockError } from '../errors/AppError';

async function runCartCheckoutVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 26: E-COMMERCE CART & CHECKOUT SERVICE (REDIS STOCK TTL LOCKS)');
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

  try {
    await connectDatabase().catch(() => {});
    await connectRedis().catch(() => {});

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Seed Inventory Fixtures (Warehouse, Product, 2 Batches)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 1. Warehouse
    const testWarehouse = await WarehouseModel.create({
      name: `Central Medical Depot ${suffix}`,
      warehouseCode: `WH-CHK-${suffix}`,
      type: 'CENTRAL',
      address: 'Plot 44, Tejgaon Industrial Area',
      district: 'Dhaka',
      isCentralHub: true,
      isActive: true,
    });
    assert(!!testWarehouse._id, `Created test warehouse: ${testWarehouse.name}`);

    // 2. Product
    const testSku = `MED-GLV-${suffix}`;
    const testProduct = await ProductModel.create({
      sku: testSku,
      nameEn: `Nitrile Examination Gloves Powder-Free ${suffix}`,
      category: 'MEDICAL_DISPOSABLES',
      hsCode: '4015.19.00',
      baseUom: 'BOX',
      isMedical: true,
      isExpirable: true,
      retailPrice: 500.0,
      showroomPrice: 500.0,
      resellerTierPrices: [{ tier: 1, price: 420.0 }],
      barcodes: [`BAR-${suffix}`],
      isActive: true,
    });
    assert(!!testProduct._id, `Created test product: ${testProduct.nameEn} (SKU: ${testProduct.sku})`);

    // 3. Batches: Batch 1 has 100 units, Batch 2 has 50 units (Total: 150 units)
    const batch1 = await ProductBatchModel.create({
      productId: testProduct._id,
      sku: testSku,
      batchNumber: `BATCH-A-${suffix}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year expiry
      baseUom: 'BOX',
      currentQty: 100,
      reservedQty: 0,
      unitCost: 350.0,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      warehouseId: testWarehouse._id,
      locationStatus: 'ON_HAND',
    });

    const batch2 = await ProductBatchModel.create({
      productId: testProduct._id,
      sku: testSku,
      batchNumber: `BATCH-B-${suffix}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 500 * 24 * 60 * 60 * 1000),
      baseUom: 'BOX',
      currentQty: 50,
      reservedQty: 0,
      unitCost: 360.0,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      warehouseId: testWarehouse._id,
      locationStatus: 'ON_HAND',
    });

    assert(
      batch1.currentQty === 100 && batch2.currentQty === 50,
      'Initialized 2 product batches: Batch A (100 units) + Batch B (50 units) = 150 sellable units'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify Checkout with ONLINE_SSLCOMMERZ (Redis TTL Lock & Gateway URL)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const sslCheckoutData: CheckoutDTO = {
      customerName: 'Dr. Rafiqul Islam',
      customerMobile: '+8801711' + suffix,
      customerEmail: `rafiq.${suffix}@labaid.com.bd`,
      deliveryAddress: 'House 32, Road 2, Dhanmondi',
      district: 'Dhaka',
      paymentMethod: 'ONLINE_SSLCOMMERZ',
      items: [
        {
          productId: testProduct._id,
          sku: testSku,
          quantity: 20,
          unitPrice: 500.0,
        },
      ],
      shippingFee: 120.0,
      discountAmount: 0.0,
    };

    const idempotencyKey1 = uuidv4();
    const sslResult = await CartCheckoutService.createOrderWithStockLock(
      sslCheckoutData,
      idempotencyKey1
    );

    // 2a. Sequential Order Number
    assert(
      /^ORD-\d{4}-\d{5}$/.test(sslResult.orderNo),
      `Sequential order number generated via CounterService: ${sslResult.orderNo}`
    );

    // 2b. Financial Calculations
    // Subtotal: 20 * 500 = 10,000.00
    // VAT 15%: 1,500.00
    // Shipping: 120.00
    // Grand Total: 11,620.00
    assert(sslResult.subtotal === 10000.0, 'Subtotal correctly computed: 10,000.00 BDT');
    assert(sslResult.vatTotal === 1500.0, '15% NBR VAT correctly calculated: 1,500.00 BDT');
    assert(sslResult.shippingFee === 120.0, 'Shipping fee added: 120.00 BDT');
    assert(sslResult.grandTotal === 11620.0, 'Grand total correctly computed: 11,620.00 BDT');

    // 2c. Order Status & SSLCOMMERZ Gateway
    assert(sslResult.orderStatus === 'PENDING', 'Online order status is PENDING awaiting payment callback');
    assert(sslResult.paymentStatus === 'UNPAID', 'Payment status is UNPAID');
    assert(
      typeof sslResult.gatewayUrl === 'string' &&
        sslResult.gatewayUrl.startsWith('https://sandbox.sslcommerz.com/EasyCheckOut/'),
      `SSLCOMMERZ gateway session redirect URL generated: ${sslResult.gatewayUrl}`
    );

    // 2d. Atomic ProductBatch.reservedQty Increment
    const batch1AfterSsl = await ProductBatchModel.findById(batch1._id);
    assert(
      batch1AfterSsl?.reservedQty === 20,
      'ProductBatch.reservedQty incremented atomically from 0 to 20'
    );

    // 2e. Redis Stock TTL Lock Key
    const redisKey = `stock_lock:${testSku}:${sslResult.orderNo}`;
    const reservationData: any = await redisGet(redisKey);
    assert(
      reservationData && reservationData.quantity === 20,
      `Redis stock TTL reservation found for key ${redisKey} with quantity 20`
    );

    const keyTtl = await redisTtl(redisKey);
    assert(
      keyTtl > 0 && keyTtl <= 900,
      `Redis reservation key has 15-minute TTL active (${keyTtl}s remaining)`
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify Checkout with Cash on Delivery (COD & Courier Consignment)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const codCheckoutData: CheckoutDTO = {
      customerName: 'Anowar Hossain',
      customerMobile: '+8801811' + suffix,
      customerEmail: `anowar.${suffix}@gmail.com`,
      deliveryAddress: 'Sector 4, Uttara',
      district: 'Dhaka',
      paymentMethod: 'COD',
      items: [
        {
          productId: testProduct._id,
          sku: testSku,
          quantity: 30,
          unitPrice: 500.0,
        },
      ],
      shippingFee: 80.0,
      discountAmount: 100.0,
    };

    const idempotencyKey2 = uuidv4();
    const codResult = await CartCheckoutService.createOrderWithStockLock(
      codCheckoutData,
      idempotencyKey2
    );

    assert(codResult.orderStatus === 'CONFIRMED', 'COD order status is immediately CONFIRMED');
    assert(codResult.paymentMethod === 'COD', 'Payment method recorded as COD');
    assert(
      codResult.subtotal === 15000.0 && codResult.vatTotal === 2250.0,
      'COD subtotal (15,000 BDT) and 15% VAT (2,250 BDT) accurate'
    );
    // Grand Total: 15,000 + 2,250 + 80 - 100 = 17,230.00 BDT
    assert(codResult.grandTotal === 17230.0, 'COD net grand total is 17,230.00 BDT');

    // Courier Consignment Scheduled in CourierConsignmentModel
    const consignment = await CourierConsignmentModel.findOne({ orderId: codResult.orderId });
    assert(!!consignment, 'CourierConsignment automatically scheduled in courier_consignments');
    assert(consignment?.courierPartner === 'PATHAO', 'Courier partner defaulted to PATHAO');
    assert(
      consignment?.consignmentId === `CONS-${codResult.orderNo}`,
      `Consignment ID generated: ${consignment?.consignmentId}`
    );
    assert(
      consignment?.trackingCode === `TRK-${codResult.orderNo}`,
      `Tracking code generated: ${consignment?.trackingCode}`
    );
    assert(consignment?.deliveryStatus === 'BOOKED', 'Consignment delivery status is BOOKED');
    assert(consignment?.codAmount === 17230.0, 'Consignment codAmount matches order grand total (17,230 BDT)');

    // Verify batch reservedQty: Batch 1 was 20 reserved, now +30 = 50 reserved
    const batch1AfterCod = await ProductBatchModel.findById(batch1._id);
    assert(batch1AfterCod?.reservedQty === 50, 'Batch 1 reservedQty updated to 50 (20 SSL + 30 COD)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify Insufficient Stock Rejection (InsufficientStockError 422)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Currently: Batch 1 has 100 - 50 = 50 available. Batch 2 has 50 - 0 = 50 available.
    // Total available sellable stock = 100 units.
    // Attempting to order 120 units must fail!
    let stockErrorCaught = false;
    let caughtStockErr: InsufficientStockError | null = null;

    try {
      await CartCheckoutService.createOrderWithStockLock({
        customerName: 'Greedy Buyer',
        customerMobile: '+8801999' + suffix,
        deliveryAddress: 'Banani DOHS',
        district: 'Dhaka',
        paymentMethod: 'COD',
        items: [
          {
            productId: testProduct._id,
            sku: testSku,
            quantity: 120, // Exceeds 100 available!
            unitPrice: 500.0,
          },
        ],
      });
    } catch (err: any) {
      if (err instanceof InsufficientStockError) {
        stockErrorCaught = true;
        caughtStockErr = err;
      }
    }

    assert(stockErrorCaught, 'InsufficientStockError thrown when requested quantity (120) exceeds available stock (100)');
    assert(caughtStockErr?.statusCode === 422, 'InsufficientStockError has statusCode 422');
    assert(caughtStockErr?.errorCode === 'INSUFFICIENT_STOCK', 'InsufficientStockError has errorCode INSUFFICIENT_STOCK');
    assert(caughtStockErr?.requestedQty === 120, 'Error reports requestedQty: 120');
    assert(caughtStockErr?.availableQty === 100, 'Error reports availableQty: 100');

    // Ensure batch reserved quantities were not altered
    const batch1AfterFail = await ProductBatchModel.findById(batch1._id);
    const batch2AfterFail = await ProductBatchModel.findById(batch2._id);
    assert(
      batch1AfterFail?.reservedQty === 50 && batch2AfterFail?.reservedQty === 0,
      'Batch reservedQty untouched after stock rejection'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify X-Idempotency-Key Protection & Replay');
    console.log('────────────────────────────────────────────────────────────────────────');

    const replayKey = uuidv4();
    const idempotencyPayload: CheckoutDTO = {
      customerName: 'Tariq Rahman',
      customerMobile: '+8801666' + suffix,
      deliveryAddress: 'Gulshan 1',
      district: 'Dhaka',
      paymentMethod: 'COD',
      items: [
        {
          productId: testProduct._id,
          sku: testSku,
          quantity: 10,
          unitPrice: 500.0,
        },
      ],
      shippingFee: 80.0,
    };

    // First call
    const firstCallResult = await CartCheckoutService.createOrderWithStockLock(
      idempotencyPayload,
      replayKey
    );
    assert(!!firstCallResult.orderNo, `First checkout with idempotency key succeeded: ${firstCallResult.orderNo}`);

    // Replay call with exact same idempotency key
    const replayCallResult = await CartCheckoutService.createOrderWithStockLock(
      idempotencyPayload,
      replayKey
    );
    assert(
      replayCallResult.orderNo === firstCallResult.orderNo,
      `Idempotent replay returned identical orderNo: ${replayCallResult.orderNo}`
    );
    assert(
      replayCallResult.grandTotal === firstCallResult.grandTotal,
      'Idempotent replay returned identical grandTotal'
    );

    // Verify database: only ONE order created with this idempotency key
    const orderCount = await OrderModel.countDocuments({ idempotencyKey: replayKey });
    assert(orderCount === 1, 'Database confirms exactly 1 order record created (no duplicate charge)');

    const batch1AfterIdemp = await ProductBatchModel.findById(batch1._id);
    assert(
      batch1AfterIdemp?.reservedQty === 60,
      'Stock only reserved once (50 + 10 = 60), not doubled by retry'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  6. Verify Stock Reservation Release Helper (releaseStockReservation)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Release reservation for Scenario 1's order (20 units on Batch 1)
    await CartCheckoutService.releaseStockReservation(sslResult.orderNo);

    const batch1AfterRelease = await ProductBatchModel.findById(batch1._id);
    assert(
      batch1AfterRelease?.reservedQty === 40,
      'Batch 1 reservedQty decremented from 60 to 40 (-20 units released)'
    );

    const cancelledOrder = await OrderModel.findOne({ orderNo: sslResult.orderNo });
    assert(cancelledOrder?.orderStatus === 'CANCELLED', 'Unpaid expired order status transitioned to CANCELLED');

    const redisReservationAfterRelease = await redisGet(redisKey);
    assert(
      redisReservationAfterRelease === null,
      'Redis TTL stock lock key deleted upon reservation release'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  Clean Up Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      WarehouseModel.deleteOne({ _id: testWarehouse._id }),
      ProductModel.deleteOne({ _id: testProduct._id }),
      ProductBatchModel.deleteMany({ _id: { $in: [batch1._id, batch2._id] } }),
      CustomerModel.deleteMany({
        mobile: {
          $in: [
            sslCheckoutData.customerMobile,
            codCheckoutData.customerMobile,
            idempotencyPayload.customerMobile,
          ],
        },
      }),
      OrderModel.deleteMany({
        orderNo: { $in: [sslResult.orderNo, codResult.orderNo, firstCallResult.orderNo] },
      }),
      CourierConsignmentModel.deleteMany({
        consignmentId: { $in: [`CONS-${codResult.orderNo}`] },
      }),
      IdempotencyKeyModel.deleteMany({
        key: { $in: [idempotencyKey1, idempotencyKey2, replayKey] },
      }),
    ]);

    assert(true, 'Test fixtures safely removed from database');
  } catch (error: any) {
    console.error('💥 Unhandled exception during cart checkout verification:', error);
    failed++;
  } finally {
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

runCartCheckoutVerificationSuite();
