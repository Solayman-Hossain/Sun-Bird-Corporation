import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { WarehouseModel } from '../models/Warehouse';
import { UserModel } from '../models/User';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { StockLedgerModel } from '../models/StockLedger';
import { OrderModel } from '../models/Order';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { JournalEntryModel } from '../models/JournalEntry';
import { CustomerModel } from '../models/Customer';
import { PosCheckoutService, PosCheckoutDTO } from './PosCheckoutService';
import { ForbiddenError, InsufficientStockError } from '../errors/AppError';

async function runPosCheckoutVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 27: SHOWROOM POS TERMINAL DIRECT CHECKOUT SERVICE');
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

    console.log('────────────────────────────────────────────────────────────────────────');
    console.log('  1. Seed POS Fixtures (Showroom, Cashier, Products, Batches)');
    console.log('────────────────────────────────────────────────────────────────────────');

    // 1. Showroom Warehouse & Alternate Warehouse
    const showroomWarehouse = await WarehouseModel.create({
      name: `Dhanmondi Showroom Hub ${suffix}`,
      warehouseCode: `WH-SHW-${suffix}`,
      type: 'OUTLET',
      address: 'House 28, Road 7, Dhanmondi',
      district: 'Dhaka',
      isCentralHub: false,
      isActive: true,
      mobile: '+8801711999888',
    });

    const altWarehouse = await WarehouseModel.create({
      name: `Uttara Showroom Hub ${suffix}`,
      warehouseCode: `WH-ALT-${suffix}`,
      type: 'OUTLET',
      address: 'Sector 3, Uttara',
      district: 'Dhaka',
      isCentralHub: false,
      isActive: true,
    });
    assert(!!showroomWarehouse._id, `Created showroom warehouse: ${showroomWarehouse.name}`);

    // 2. Cashier Users (Authorized vs Unauthorized)
    const authorizedCashier = await UserModel.create({
      fullName: `Cashier Sadia ${suffix}`,
      email: `cashier.sadia.${suffix}@sunbird.com`,
      mobile: `+8801733${suffix}`,
      userType: 'STAFF',
      warehouseId: showroomWarehouse._id,
      isActive: true,
    });

    const unauthorizedCashier = await UserModel.create({
      fullName: `Cashier Faruk ${suffix}`,
      email: `cashier.faruk.${suffix}@sunbird.com`,
      mobile: `+8801744${suffix}`,
      userType: 'STAFF',
      warehouseId: altWarehouse._id, // Assigned to alternate warehouse!
      isActive: true,
    });
    assert(!!authorizedCashier._id, `Created authorized cashier: ${authorizedCashier.fullName}`);

    // 3. Product & Inventory Batch
    const testSku = `SYR-5ML-${suffix}`;
    const testProduct = await ProductModel.create({
      sku: testSku,
      nameEn: `Disposable Syringe 5ml Luer Lock ${suffix}`,
      category: 'MEDICAL_DISPOSABLES',
      hsCode: '9018.31.00',
      baseUom: 'PCS',
      isMedical: true,
      retailPrice: 20.0,
      showroomPrice: 20.0,
      resellerTierPrices: [{ tier: 1, price: 16.0 }],
      barcodes: [`BAR-POS-${suffix}`],
      isActive: true,
    });

    const testBatch = await ProductBatchModel.create({
      productId: testProduct._id,
      sku: testSku,
      batchNumber: `BATCH-POS-${suffix}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      baseUom: 'PCS',
      currentQty: 100, // 100 on-hand units in showroom
      reservedQty: 0,
      unitCost: 10.0, // 10.00 BDT WAC unit cost
      hasIndividualSerials: false,
      warrantyMonths: 0,
      warehouseId: showroomWarehouse._id,
      locationStatus: 'ON_HAND',
    });
    assert(
      testBatch.currentQty === 100 && testBatch.unitCost === 10.0,
      'Initialized product batch with 100 units at 10.00 BDT WAC cost in showroom'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verify High-Velocity Cash POS Checkout (Single Transaction)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const cashCheckoutData: PosCheckoutDTO = {
      showroomWarehouseId: showroomWarehouse._id,
      customerName: 'Dr. Mahmudul Hasan',
      customerMobile: '+8801722' + suffix,
      paymentMethod: 'CASH',
      items: [
        {
          productId: testProduct._id,
          sku: testSku,
          batchId: testBatch._id,
          quantity: 10,
          unitPrice: 20.0, // 10 * 20 = 200 BDT subtotal
        },
      ],
      paidAmount: 300.0,
      discountAmount: 0.0,
    };

    const cashResult = await PosCheckoutService.processPosCheckout(
      cashCheckoutData,
      authorizedCashier._id
    );

    // 2a. Sequential Identifiers
    assert(/^ORD-\d{4}-\d{5}$/.test(cashResult.orderNo), `Order generated: ${cashResult.orderNo}`);
    assert(/^CH-\d{4}-\d{5}$/.test(cashResult.challanNo), `Challan generated: ${cashResult.challanNo}`);
    assert(/^INV-\d{4}-\d{5}$/.test(cashResult.invoiceNo), `Invoice generated: ${cashResult.invoiceNo}`);
    assert(/^JV-\d{4}-\d{5}$/.test(cashResult.journalVoucherNo), `Journal Voucher generated: ${cashResult.journalVoucherNo}`);

    // 2b. Financial Computations
    // Subtotal: 200.00 BDT, VAT 15%: 30.00 BDT, Grand Total: 230.00 BDT, Paid: 300.00 BDT, Change: 70.00 BDT
    assert(cashResult.subtotal === 200.0, 'Subtotal is 200.00 BDT');
    assert(cashResult.vatTotal === 30.0, '15% NBR VAT is 30.00 BDT');
    assert(cashResult.grandTotal === 230.0, 'Grand total is 230.00 BDT');
    assert(cashResult.changeAmount === 70.0, 'Change amount is exactly 70.00 BDT (300 - 230)');

    // 2c. Direct Batch Stock Deduction
    const batchAfterCash = await ProductBatchModel.findById(testBatch._id);
    assert(
      batchAfterCash?.currentQty === 90,
      'ProductBatch.currentQty directly decremented from 100 to 90 (-10 units sold)'
    );

    // 2d. StockLedger Movement
    const ledgerEntry = await StockLedgerModel.findOne({
      referenceNo: cashResult.invoiceNo,
      movementType: 'POS_BATCH',
    });
    assert(!!ledgerEntry, 'Stock movement logged in stock_ledger with movementType: POS_BATCH');
    assert(ledgerEntry?.qtyChange === -10, 'qtyChange in stock_ledger is -10');
    assert(ledgerEntry?.unitCost === 10.0, 'unitCost recorded on stock ledger movement');

    // 2e. Delivery Challan (Mushak-6.3)
    const challanDoc = await DeliveryChallanModel.findById(cashResult.challanId);
    assert(!!challanDoc, 'DeliveryChallan persisted in delivery_challans');
    assert(challanDoc?.companyBin === '0012345670101', 'Sun Bird statutory 13-digit BIN recorded');
    assert(challanDoc?.status === 'DELIVERED', 'Challan status marked as DELIVERED');
    assert(challanDoc?.items[0].dispatchedQty === 10, 'Dispatched quantity matches checkout');

    // 2f. Sales Invoice
    const invoiceDoc = await SalesInvoiceModel.findById(cashResult.invoiceId);
    assert(!!invoiceDoc, 'SalesInvoice persisted in sales_invoices');
    assert(invoiceDoc?.status === 'PAID' && invoiceDoc.paymentStatus === 'PAID', 'Invoice status is PAID');
    assert(invoiceDoc?.dueAmount === 0, 'Invoice dueAmount is 0');
    assert(invoiceDoc?.mushakInvoiceNo === `MUS-6.3-${cashResult.invoiceNo}`, 'Mushak-6.3 invoice reference formatted');

    // 2g. Balanced Double-Entry Accounting Journal in journal_entries
    const jvDoc = await JournalEntryModel.findOne({ voucherNo: cashResult.journalVoucherNo });
    assert(!!jvDoc, 'JournalEntry persisted in journal_entries');
    assert(jvDoc?.status === 'POSTED', 'Journal entry status is POSTED');
    assert(jvDoc?.voucherType === 'SALES', 'Voucher type is SALES');
    assert(
      jvDoc?.totalDebit === jvDoc?.totalCredit,
      `Double-entry balanced: Total Debit (${jvDoc?.totalDebit}) == Total Credit (${jvDoc?.totalCredit})`
    );

    // Verify individual lines:
    // Debit 1010 Cash on Hand: 230 BDT
    // Credit 4010 Sales Revenue: 200 BDT
    // Credit 2050 VAT Payable: 30 BDT
    // Debit 5010 COGS: 100 BDT (10 * 10 WAC)
    // Credit 1200 Inventory: 100 BDT
    const lineCash = jvDoc?.lines.find((l) => l.accountCode === 1010);
    const lineRev = jvDoc?.lines.find((l) => l.accountCode === 4010);
    const lineVat = jvDoc?.lines.find((l) => l.accountCode === 2050);
    const lineCogs = jvDoc?.lines.find((l) => l.accountCode === 5010);
    const lineInv = jvDoc?.lines.find((l) => l.accountCode === 1200);

    assert(lineCash?.debit === 230.0, 'Line 1: Debit 1010 Cash on Hand (Till) = 230.00 BDT');
    assert(lineRev?.credit === 200.0, 'Line 2: Credit 4010 Sales Revenue = 200.00 BDT');
    assert(lineVat?.credit === 30.0, 'Line 3: Credit 2050 VAT Payable (Mushak-6.3) = 30.00 BDT');
    assert(lineCogs?.debit === 100.0, 'Line 4: Debit 5010 COGS at WAC cost = 100.00 BDT');
    assert(lineInv?.credit === 100.0, 'Line 5: Credit 1200 Inventory Merchandise = 100.00 BDT');

    // 2h. Thermal Invoice Receipt Payload
    assert(
      cashResult.thermalInvoice.company.bin === '0012345670101',
      'Thermal receipt includes Sun Bird company BIN'
    );
    assert(
      cashResult.thermalInvoice.cashier.name === authorizedCashier.fullName,
      'Thermal receipt displays cashier name'
    );
    assert(
      cashResult.thermalInvoice.qrData.includes('0012345670101'),
      'Thermal receipt contains statutory NBR QR verification payload'
    );

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verify MFS (bKash/Nagad) POS Checkout (Account 1030 MFS Clearing)');
    console.log('────────────────────────────────────────────────────────────────────────');

    const mfsCheckoutData: PosCheckoutDTO = {
      showroomWarehouseId: showroomWarehouse._id,
      customerName: 'Sultana Begum',
      customerMobile: '+8801822' + suffix,
      paymentMethod: 'MFS_BKASH',
      items: [
        {
          productId: testProduct._id,
          sku: testSku,
          batchId: testBatch._id,
          quantity: 5,
          unitPrice: 20.0, // 5 * 20 = 100 BDT + 15 VAT = 115 BDT
        },
      ],
      paidAmount: 115.0,
      discountAmount: 0.0,
    };

    const mfsResult = await PosCheckoutService.processPosCheckout(
      mfsCheckoutData,
      authorizedCashier._id
    );

    const mfsJv = await JournalEntryModel.findOne({ voucherNo: mfsResult.journalVoucherNo });
    const lineMfs = mfsJv?.lines.find((l) => l.accountCode === 1030);
    assert(lineMfs?.debit === 115.0, 'MFS checkout debited Account 1030 MFS Clearing (115.00 BDT)');
    assert(
      mfsJv?.totalDebit === mfsJv?.totalCredit,
      `MFS Journal balanced strictly: ${mfsJv?.totalDebit} == ${mfsJv?.totalCredit}`
    );

    const batchAfterMfs = await ProductBatchModel.findById(testBatch._id);
    assert(batchAfterMfs?.currentQty === 85, 'ProductBatch.currentQty further decremented to 85 (90 - 5)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verify Cashier Showroom Warehouse Assignment Security Check');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Attempt checkout using cashier assigned to alternate showroom -> Must throw ForbiddenError
    let forbiddenCaught = false;
    try {
      await PosCheckoutService.processPosCheckout(
        cashCheckoutData,
        unauthorizedCashier._id
      );
    } catch (err: any) {
      if (err instanceof ForbiddenError) {
        forbiddenCaught = true;
      }
    }
    assert(forbiddenCaught, 'Cashier assigned to different showroom rejected with ForbiddenError (403)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verify Atomic Transaction Rollback on Stock Shortage');
    console.log('────────────────────────────────────────────────────────────────────────');

    // Available is 85. Attempt to buy 150 units -> Must fail and rollback atomically!
    let stockErrorCaught = false;
    try {
      await PosCheckoutService.processPosCheckout(
        {
          showroomWarehouseId: showroomWarehouse._id,
          paymentMethod: 'CASH',
          items: [
            {
              sku: testSku,
              quantity: 150, // Shortage!
              unitPrice: 20.0,
            },
          ],
          paidAmount: 5000.0,
        },
        authorizedCashier._id
      );
    } catch (err: any) {
      if (err instanceof InsufficientStockError) {
        stockErrorCaught = true;
      }
    }
    assert(stockErrorCaught, 'Stock shortage rejected with InsufficientStockError');

    // Verify atomic rollback: currentQty must remain 85
    const batchAfterRollback = await ProductBatchModel.findById(testBatch._id);
    assert(batchAfterRollback?.currentQty === 85, 'Atomic rollback: batch currentQty unchanged at 85');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  Clean Up Test Fixtures');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      WarehouseModel.deleteMany({ _id: { $in: [showroomWarehouse._id, altWarehouse._id] } }),
      UserModel.deleteMany({ _id: { $in: [authorizedCashier._id, unauthorizedCashier._id] } }),
      ProductModel.deleteOne({ _id: testProduct._id }),
      ProductBatchModel.deleteOne({ _id: testBatch._id }),
      StockLedgerModel.deleteMany({ referenceNo: { $in: [cashResult.invoiceNo, mfsResult.invoiceNo] } }),
      OrderModel.deleteMany({ orderNo: { $in: [cashResult.orderNo, mfsResult.orderNo] } }),
      DeliveryChallanModel.deleteMany({ challanNo: { $in: [cashResult.challanNo, mfsResult.challanNo] } }),
      SalesInvoiceModel.deleteMany({ invoiceNo: { $in: [cashResult.invoiceNo, mfsResult.invoiceNo] } }),
      JournalEntryModel.deleteMany({ voucherNo: { $in: [cashResult.journalVoucherNo, mfsResult.journalVoucherNo] } }),
      CustomerModel.deleteMany({ mobile: { $in: ['+8801722' + suffix, '+8801822' + suffix] } }),
    ]);

    assert(true, 'Test fixtures safely removed from database');
  } catch (error: any) {
    console.error('💥 Unhandled exception during POS checkout verification:', error);
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

runPosCheckoutVerificationSuite();
