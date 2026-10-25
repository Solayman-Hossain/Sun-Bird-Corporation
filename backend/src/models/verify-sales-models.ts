import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  CustomerModel,
  CustomerCreditProfileModel,
  OrderModel,
  DeliveryChallanModel,
  SalesInvoiceModel,
  CourierConsignmentModel,
  ProductModel,
  UserModel,
  RoleModel,
  WarehouseModel,
} from './index';

async function runSalesModelsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 24: SALES, POS & LOGISTICS DISTRIBUTION MONGOOSE MODELS');
  console.log('  (CUSTOMER, CREDIT PROFILE, ORDER, CHALLAN, INVOICE, CONSIGNMENT)');
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
    console.log('  1. Index Initialization & Catalog Synchronization in MongoDB Atlas');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      CustomerModel.createIndexes(),
      CustomerCreditProfileModel.createIndexes(),
      OrderModel.createIndexes(),
      DeliveryChallanModel.createIndexes(),
      SalesInvoiceModel.createIndexes(),
      CourierConsignmentModel.createIndexes(),
    ]);

    assert(true, 'All 6 sales & distribution model collections initialized and createIndexes completed');

    // Retrieve indexes directly from MongoDB's system catalog
    const customerIndexes = await CustomerModel.collection.indexes();
    const creditProfileIndexes = await CustomerCreditProfileModel.collection.indexes();
    const orderIndexes = await OrderModel.collection.indexes();
    const challanIndexes = await DeliveryChallanModel.collection.indexes();
    const invoiceIndexes = await SalesInvoiceModel.collection.indexes();
    const consignmentIndexes = await CourierConsignmentModel.collection.indexes();

    function hasIndex(indexes: any[], keyObj: Record<string, number>, unique?: boolean, sparse?: boolean): boolean {
      return indexes.some((idx) => {
        const keys = Object.keys(keyObj);
        const idxKeys = Object.keys(idx.key);
        if (keys.length !== idxKeys.length) return false;
        const matchesKey = keys.every((k) => idx.key[k] === keyObj[k]);
        if (!matchesKey) return false;
        if (unique !== undefined && !!idx.unique !== unique) return false;
        if (sparse !== undefined && !!idx.sparse !== sparse) return false;
        return true;
      });
    }

    // 1. Customer Indexes (§4.1)
    assert(hasIndex(customerIndexes, { mobile: 1 }, true), 'Customer: { mobile: 1 } UNIQUE index exists in catalog');
    assert(hasIndex(customerIndexes, { customerType: 1, isActive: 1 }), 'Customer: { customerType: 1, isActive: 1 } compound index exists');
    assert(hasIndex(customerIndexes, { companyName: 1 }), 'Customer: { companyName: 1 } index exists');
    assert(hasIndex(customerIndexes, { isGuest: 1 }), 'Customer: { isGuest: 1 } index exists');

    // 2. CustomerCreditProfile Indexes (§4.2)
    assert(hasIndex(creditProfileIndexes, { customerId: 1 }, true), 'CustomerCreditProfile: { customerId: 1 } UNIQUE index exists');
    assert(hasIndex(creditProfileIndexes, { isCreditLocked: 1 }), 'CustomerCreditProfile: { isCreditLocked: 1 } index exists');

    // 3. Order Indexes (§4.3)
    assert(hasIndex(orderIndexes, { orderNo: 1 }, true), 'Order: { orderNo: 1 } UNIQUE index exists');
    assert(hasIndex(orderIndexes, { customerId: 1, orderStatus: 1 }), 'Order: { customerId: 1, orderStatus: 1 } compound index exists');
    assert(hasIndex(orderIndexes, { orderStatus: 1, createdAt: -1 }), 'Order: { orderStatus: 1, createdAt: -1 } compound index exists');
    assert(hasIndex(orderIndexes, { paymentStatus: 1 }), 'Order: { paymentStatus: 1 } index exists');
    assert(hasIndex(orderIndexes, { salesRepId: 1 }), 'Order: { salesRepId: 1 } index exists');
    assert(hasIndex(orderIndexes, { createdAt: -1 }), 'Order: { createdAt: -1 } time-sorted index exists');
    assert(hasIndex(orderIndexes, { idempotencyKey: 1 }, true, true), 'Order: { idempotencyKey: 1 } SPARSE UNIQUE index exists');

    // 4. DeliveryChallan Indexes (§4.4)
    assert(hasIndex(challanIndexes, { challanNo: 1 }, true), 'DeliveryChallan: { challanNo: 1 } UNIQUE index exists');
    assert(hasIndex(challanIndexes, { orderId: 1 }), 'DeliveryChallan: { orderId: 1 } index exists');
    assert(hasIndex(challanIndexes, { customerId: 1 }), 'DeliveryChallan: { customerId: 1 } index exists');
    assert(hasIndex(challanIndexes, { status: 1 }), 'DeliveryChallan: { status: 1 } index exists');
    assert(hasIndex(challanIndexes, { dispatchTime: -1 }), 'DeliveryChallan: { dispatchTime: -1 } index exists');

    // 5. SalesInvoice Indexes (§4.5)
    assert(hasIndex(invoiceIndexes, { invoiceNo: 1 }, true), 'SalesInvoice: { invoiceNo: 1 } UNIQUE index exists');
    assert(hasIndex(invoiceIndexes, { customerId: 1, paymentStatus: 1 }), 'SalesInvoice: { customerId: 1, paymentStatus: 1 } compound index exists');
    assert(hasIndex(invoiceIndexes, { status: 1 }), 'SalesInvoice: { status: 1 } index exists');
    assert(hasIndex(invoiceIndexes, { dueDate: 1 }), 'SalesInvoice: { dueDate: 1 } overdue index exists');
    assert(hasIndex(invoiceIndexes, { orderId: 1 }), 'SalesInvoice: { orderId: 1 } reverse lookup index exists');

    // 6. CourierConsignment Indexes (§4.6)
    assert(hasIndex(consignmentIndexes, { trackingCode: 1 }, true), 'CourierConsignment: { trackingCode: 1 } UNIQUE index exists');
    assert(hasIndex(consignmentIndexes, { consignmentId: 1 }, true), 'CourierConsignment: { consignmentId: 1 } UNIQUE index exists');
    assert(hasIndex(consignmentIndexes, { orderId: 1 }), 'CourierConsignment: { orderId: 1 } index exists');
    assert(hasIndex(consignmentIndexes, { deliveryStatus: 1 }), 'CourierConsignment: { deliveryStatus: 1 } index exists');
    assert(hasIndex(consignmentIndexes, { remittanceId: 1 }), 'CourierConsignment: { remittanceId: 1 } index exists');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  2. Setup Mock Dependencies & Reference Records');
    console.log('────────────────────────────────────────────────────────────────────────');

    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();

    // 1. Setup Role & Staff User
    let role = await RoleModel.findOne({ slug: 'sales-manager' });
    if (!role) {
      role = await RoleModel.create({
        roleName: `Sales Manager ${suffix}`,
        slug: `sales-manager-${suffix.toLowerCase()}`,
        description: 'Sales Management Role',
        permissions: [{ module: 'SALES', actions: ['CREATE', 'READ'] }],
      });
    }

    const testStaff = await UserModel.create({
      fullName: `Sales Executive ${suffix}`,
      email: `sales.${suffix.toLowerCase()}@sunbird.com.bd`,
      mobile: `+8801700${Math.floor(100000 + Math.random() * 900000)}`,
      userType: 'STAFF',
      roleId: role._id,
      isActive: true,
    });
    assert(!!testStaff._id, 'Sales staff user created');

    // 2. Setup Warehouse
    let warehouse = await WarehouseModel.findOne({ type: 'CENTRAL' });
    if (!warehouse) {
      warehouse = await WarehouseModel.create({
        warehouseCode: `WH-${suffix}`,
        name: `Central Warehouse ${suffix}`,
        type: 'CENTRAL',
        address: 'Tejgaon I/A, Dhaka',
        district: 'Dhaka',
        isActive: true,
      });
    }
    assert(!!warehouse._id, 'Warehouse reference verified');

    // 3. Setup Product
    const testProduct = await ProductModel.create({
      sku: `PROD-TEST-${suffix}`,
      nameEn: `High-End Ultrasound Scanner ${suffix}`,
      nameBn: 'আল্ট্রাসাউন্ড স্ক্যানার',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.12.00',
      baseUom: 'UNIT',
      brand: 'Chison',
      isMedical: true,
      isExpirable: false,
      retailPrice: 850000,
      showroomPrice: 820000,
      isActive: true,
    });
    assert(!!testProduct._id, `Medical equipment product created: ${testProduct.sku}`);

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  3. Customer Master & NBR BIN Validation (§4.1)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const customerMobile = `+88018${Math.floor(10000000 + Math.random() * 90000000)}`;
    const b2bCustomer = await CustomerModel.create({
      fullName: `Dr. K. Rahman (${suffix})`,
      email: `director.${suffix.toLowerCase()}@cityhospital.com.bd`,
      mobile: customerMobile,
      customerType: 'B2B_HOSPITAL',
      companyName: `City General Hospital Ltd. (${suffix})`,
      buyerBin: '1234567890123', // 13-digit NBR BIN
      billingAddress: 'House 14, Road 7, Dhanmondi, Dhaka',
      shippingAddress: 'Plot 45, Sector 11, Uttara, Dhaka',
      isGuest: false,
      isActive: true,
      registeredVia: 'B2B_PORTAL',
    });

    assert(b2bCustomer.customerType === 'B2B_HOSPITAL', 'Customer type correctly set to B2B_HOSPITAL');
    assert(b2bCustomer.buyerBin === '1234567890123', 'NBR 13-digit BIN preserved');
    assert(b2bCustomer.isGuest === false, 'Customer isGuest correctly set to false');

    // Duplicate mobile rejection
    let dupCustomerError = false;
    try {
      await CustomerModel.create({
        fullName: 'Duplicate Mobile Customer',
        mobile: customerMobile,
        customerType: 'RETAIL',
      });
    } catch (err: any) {
      dupCustomerError = err.code === 11000;
    }
    assert(dupCustomerError, 'Unique mobile constraint properly enforced (E11000)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  4. B2B Customer Credit Profile & Credit Gate Logic (§4.2)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const creditProfile = await CustomerCreditProfileModel.create({
      customerId: b2bCustomer._id,
      creditLimitBDT: 5000000, // 50 Lakh BDT
      creditTermDays: 45,      // Net 45
      currentOutstandingAR: 1200000, // 12 Lakh current AR
      unbilledDispatches: 300000,     // 3 Lakh unbilled dispatches
      isCreditLocked: false,
      approvedByDirector: testStaff._id,
    });

    assert(creditProfile.creditLimitBDT === 5000000, 'Credit limit initialized to 5,000,000 BDT');
    assert(creditProfile.creditTermDays === 45, 'Credit term days set to 45 (Net 45)');

    // Real-time AR credit gate calculation
    const availableCredit = creditProfile.creditLimitBDT - (creditProfile.currentOutstandingAR + creditProfile.unbilledDispatches);
    assert(availableCredit === 3500000, `Available credit correctly computed: 3,500,000 BDT (got ${availableCredit})`);

    // Duplicate credit profile for same customer rejected
    let dupCreditError = false;
    try {
      await CustomerCreditProfileModel.create({
        customerId: b2bCustomer._id,
        creditLimitBDT: 1000000,
        creditTermDays: 30,
      });
    } catch (err: any) {
      dupCreditError = err.code === 11000;
    }
    assert(dupCreditError, 'CustomerCreditProfile 1-to-1 unique customerId constraint enforced (E11000)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  5. Sales Orders & Cart State (§4.3)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const orderNo = `ORD-2026-${suffix}`;
    const idempotencyKey = `IDEMP-ORD-${suffix}`;

    const order = await OrderModel.create({
      orderNo,
      customerId: b2bCustomer._id,
      salesRepId: testStaff._id,
      orderChannel: 'B2B_DIRECT',
      channel: 'B2B_PORTAL',
      items: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          batchNumber: `BATCH-2026-${suffix}`,
          qty: 2,
          uom: 'UNIT',
          unitPrice: 850000,
          lineTotal: 1700000,
          vatAmount: 255000, // 15% VAT
        },
      ],
      subtotal: 1700000,
      vatTotal: 255000,
      grandTotal: 1955000,
      paymentMethod: 'CREDIT',
      codOtpStatus: 'NOT_REQUIRED',
      paymentStatus: 'UNPAID',
      orderStatus: 'CONFIRMED',
      shippingAddress: b2bCustomer.shippingAddress || 'Dhaka',
      idempotencyKey,
    });

    assert(order.orderNo === orderNo, `Order created with orderNo: ${order.orderNo}`);
    assert(order.orderStatus === 'CONFIRMED', 'Order status initialized to CONFIRMED');
    assert(order.grandTotal === 1955000, 'Order grandTotal correctly saved (1,955,000 BDT)');
    assert(order.items.length === 1, 'Order item array stored correctly');

    // Duplicate orderNo rejection
    let dupOrderError = false;
    try {
      await OrderModel.create({
        orderNo,
        customerId: b2bCustomer._id,
        orderChannel: 'ECOMMERCE',
        items: order.items,
        subtotal: 1700000,
        grandTotal: 1955000,
        paymentMethod: 'COD',
        shippingAddress: 'Dhaka',
      });
    } catch (err: any) {
      dupOrderError = err.code === 11000;
    }
    assert(dupOrderError, 'Duplicate orderNo rejected by unique index (E11000)');

    // Duplicate idempotencyKey rejection
    let dupIdempError = false;
    try {
      await OrderModel.create({
        orderNo: `ORD-DIFF-${suffix}`,
        customerId: b2bCustomer._id,
        orderChannel: 'ECOMMERCE',
        items: order.items,
        subtotal: 1700000,
        grandTotal: 1955000,
        paymentMethod: 'COD',
        shippingAddress: 'Dhaka',
        idempotencyKey,
      });
    } catch (err: any) {
      dupIdempError = err.code === 11000;
    }
    assert(dupIdempError, 'Duplicate idempotencyKey rejected by sparse unique index (E11000)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  6. Delivery Challan (NBR Mushak-6.3) (§4.4)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const challanNo = `CH-2026-${suffix}`;
    const challan = await DeliveryChallanModel.create({
      challanNo,
      orderId: order._id,
      customerId: b2bCustomer._id,
      companyBin: '0012345670101', // Sun Bird 13-digit BIN
      buyerBin: b2bCustomer.buyerBin,
      vehicleNumber: 'DHAKA-METRO-D-11-2026',
      dispatchTime: new Date(),
      transporterType: 'OWN_FLEET',
      cartonCount: 2,
      items: [
        {
          productId: testProduct._id,
          sku: testProduct.sku,
          productName: testProduct.nameEn,
          hsCode: testProduct.hsCode,
          batchNumber: `BATCH-2026-${suffix}`,
          dispatchedQty: 2,
          uom: 'UNIT',
          dispatchedSerials: [`SN-${suffix}-001`, `SN-${suffix}-002`],
          vatRate: 15.0,
          sdRate: 0.0,
        },
      ],
      status: 'DISPATCHED',
      preparedBy: testStaff._id,
      approvedBy: testStaff._id,
    });

    assert(challan.challanNo === challanNo, `Delivery challan created with challanNo: ${challan.challanNo}`);
    assert(challan.status === 'DISPATCHED', 'Challan status set to DISPATCHED');
    assert(challan.items[0].dispatchedSerials.length === 2, 'Serialized unit tracking stored on challan items');
    assert(challan.vehicleNumber === 'DHAKA-METRO-D-11-2026', 'Vehicle registration recorded for transport');

    // Duplicate challanNo rejection
    let dupChallanError = false;
    try {
      await DeliveryChallanModel.create({
        challanNo,
        orderId: order._id,
        customerId: b2bCustomer._id,
        companyBin: '0012345670101',
        items: challan.items,
        status: 'DRAFT',
        preparedBy: testStaff._id,
      });
    } catch (err: any) {
      dupChallanError = err.code === 11000;
    }
    assert(dupChallanError, 'Duplicate challanNo rejected by unique index (E11000)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  7. Sales Tax Invoice (§4.5)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const invoiceNo = `INV-2026-${suffix}`;
    const dueDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000); // 45 days forward

    const invoice = await SalesInvoiceModel.create({
      invoiceNo,
      challanId: challan._id,
      orderId: order._id,
      customerId: b2bCustomer._id,
      branchId: warehouse._id,
      invoiceDate: new Date(),
      dueDate,
      mushakInvoiceNo: `MUS-6.3-${suffix}`,
      subtotal: 1700000,
      discountAmount: 0,
      vatRate: 15.0,
      vatTotal: 255000,
      grandTotal: 1955000,
      paidAmount: 0,
      dueAmount: 1955000,
      paymentStatus: 'UNPAID',
      status: 'ISSUED',
      preparedBy: testStaff._id,
    });

    assert(invoice.invoiceNo === invoiceNo, `Sales invoice created with invoiceNo: ${invoice.invoiceNo}`);
    assert(invoice.paymentStatus === 'UNPAID', 'Invoice payment status set to UNPAID');
    assert(invoice.status === 'ISSUED', 'Invoice status set to ISSUED');
    assert(invoice.dueAmount === 1955000, 'Invoice dueAmount matches grandTotal (1,955,000 BDT)');
    assert(invoice.mushakInvoiceNo === `MUS-6.3-${suffix}`, 'Mushak 6.3 reference stored');

    // Duplicate invoiceNo rejection
    let dupInvoiceError = false;
    try {
      await SalesInvoiceModel.create({
        invoiceNo,
        challanId: challan._id,
        orderId: order._id,
        customerId: b2bCustomer._id,
        dueDate,
        subtotal: 1700000,
        grandTotal: 1955000,
        dueAmount: 1955000,
        preparedBy: testStaff._id,
      });
    } catch (err: any) {
      dupInvoiceError = err.code === 11000;
    }
    assert(dupInvoiceError, 'Duplicate invoiceNo rejected by unique index (E11000)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  8. Courier Consignment (AWB & Tracking) (§4.6)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const consignmentId = `CN-PATHAO-${suffix}`;
    const trackingCode = `TRK-${suffix}`;

    const consignment = await CourierConsignmentModel.create({
      orderId: order._id,
      challanId: challan._id,
      courierPartner: 'PATHAO',
      consignmentId,
      trackingCode,
      recipientName: b2bCustomer.fullName,
      recipientPhone: b2bCustomer.mobile,
      recipientAddress: b2bCustomer.shippingAddress || 'Uttara, Dhaka',
      weightKg: 25.5,
      codAmount: 0, // B2B credit order
      courierFee: 1200,
      deliveryStatus: 'BOOKED',
      remittanceId: `REM-${suffix}`,
      remittanceAmount: 0,
    });

    assert(consignment.consignmentId === consignmentId, `Courier consignment created with consignmentId: ${consignment.consignmentId}`);
    assert(consignment.trackingCode === trackingCode, `Public AWB trackingCode stored: ${consignment.trackingCode}`);
    assert(consignment.deliveryStatus === 'BOOKED', 'Courier deliveryStatus set to BOOKED');
    assert(consignment.weightKg === 25.5, 'Parcel consignment weight recorded: 25.5 kg');

    // Duplicate consignmentId rejection
    let dupConsignmentError = false;
    try {
      await CourierConsignmentModel.create({
        orderId: order._id,
        challanId: challan._id,
        courierPartner: 'STEADFAST',
        consignmentId,
        trackingCode: `TRK-DIFF-${suffix}`,
        recipientName: 'Another Recipient',
        recipientPhone: '+8801999999999',
        recipientAddress: 'Chittagong',
        weightKg: 5,
      });
    } catch (err: any) {
      dupConsignmentError = err.code === 11000;
    }
    assert(dupConsignmentError, 'Duplicate consignmentId rejected by unique index (E11000)');

    // Duplicate trackingCode rejection
    let dupTrackingError = false;
    try {
      await CourierConsignmentModel.create({
        orderId: order._id,
        challanId: challan._id,
        courierPartner: 'STEADFAST',
        consignmentId: `CN-DIFF-${suffix}`,
        trackingCode,
        recipientName: 'Another Recipient',
        recipientPhone: '+8801999999999',
        recipientAddress: 'Chittagong',
        weightKg: 5,
      });
    } catch (err: any) {
      dupTrackingError = err.code === 11000;
    }
    assert(dupTrackingError, 'Duplicate trackingCode rejected by unique index (E11000)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  9. Tear Down Verification Artifacts Cleanly');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      CourierConsignmentModel.deleteOne({ _id: consignment._id }),
      SalesInvoiceModel.deleteOne({ _id: invoice._id }),
      DeliveryChallanModel.deleteOne({ _id: challan._id }),
      OrderModel.deleteOne({ _id: order._id }),
      CustomerCreditProfileModel.deleteOne({ _id: creditProfile._id }),
      CustomerModel.deleteOne({ _id: b2bCustomer._id }),
      ProductModel.deleteOne({ _id: testProduct._id }),
      UserModel.deleteOne({ _id: testStaff._id }),
    ]);

    assert(true, 'Test records cleaned up cleanly from MongoDB Atlas');

    console.log('\n════════════════════════════════════════════════════════════════════════');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('════════════════════════════════════════════════════════════════════════\n');

    await disconnectDatabase();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Unhandled verification error:', err);
    await disconnectDatabase().catch(() => {});
    process.exit(1);
  }
}

runSalesModelsVerificationSuite();
