import { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/database';
import {
  ProductModel,
  UomConversionModel,
  ProductBatchModel,
  UnitSerialModel,
  StockLedgerModel,
} from './index';

async function runProductInventoryModelsVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PROMPT 11: PRODUCT & INVENTORY MONGOOSE MODELS VERIFICATION SUITE');
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
    console.log('  1. Index Initialization & Synchronization');
    console.log('────────────────────────────────────────────────────────────────────────');

    await Promise.all([
      ProductModel.createIndexes(),
      UomConversionModel.createIndexes(),
      ProductBatchModel.createIndexes(),
      UnitSerialModel.createIndexes(),
      StockLedgerModel.createIndexes(),
    ]);

    assert(true, 'All 5 model collections initialized and createIndexes completed');

    // Retrieve indexes from MongoDB
    const productIndexes = await ProductModel.collection.indexes();
    const uomIndexes = await UomConversionModel.collection.indexes();
    const batchIndexes = await ProductBatchModel.collection.indexes();
    const serialIndexes = await UnitSerialModel.collection.indexes();
    const ledgerIndexes = await StockLedgerModel.collection.indexes();

    function hasIndex(indexes: any[], keyObj: Record<string, number>, unique?: boolean): boolean {
      return indexes.some((idx) => {
        const keyMatch = Object.entries(keyObj).every(
          ([k, v]) => idx.key && idx.key[k] === v && Object.keys(idx.key).length === Object.keys(keyObj).length
        );
        if (!keyMatch) return false;
        if (unique !== undefined) {
          return Boolean(idx.unique) === unique;
        }
        return true;
      });
    }

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  2. Verifying ProductModel Indexes (§2.1)');
    console.log('────────────────────────────────────────────────────────────────────────');
    assert(hasIndex(productIndexes, { sku: 1 }, true), 'Product index: { sku: 1 } (UNIQUE)');
    assert(hasIndex(productIndexes, { category: 1, isActive: 1 }), 'Product index: { category: 1, isActive: 1 } (COMPOUND)');
    assert(hasIndex(productIndexes, { barcodes: 1 }), 'Product index: { barcodes: 1 } (MULTIKEY)');
    assert(hasIndex(productIndexes, { isMedical: 1 }), 'Product index: { isMedical: 1 } (SINGLE)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  3. Verifying UomConversionModel Indexes (§2.2)');
    console.log('────────────────────────────────────────────────────────────────────────');
    assert(
      hasIndex(uomIndexes, { productId: 1, fromUom: 1, toUom: 1 }, true),
      'UomConversion index: { productId: 1, fromUom: 1, toUom: 1 } (UNIQUE COMPOUND)'
    );
    assert(hasIndex(uomIndexes, { sku: 1 }), 'UomConversion index: { sku: 1 } (SINGLE)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  4. Verifying ProductBatchModel Indexes (§2.3)');
    console.log('────────────────────────────────────────────────────────────────────────');
    assert(
      hasIndex(batchIndexes, { sku: 1, batchNumber: 1, warehouseId: 1 }, true),
      'ProductBatch index: { sku: 1, batchNumber: 1, warehouseId: 1 } (UNIQUE COMPOUND)'
    );
    assert(hasIndex(batchIndexes, { expiryDate: 1 }), 'ProductBatch index: { expiryDate: 1 } (FEFO SORT)');
    assert(hasIndex(batchIndexes, { warehouseId: 1, currentQty: 1 }), 'ProductBatch index: { warehouseId: 1, currentQty: 1 } (COMPOUND)');
    assert(hasIndex(batchIndexes, { productId: 1 }), 'ProductBatch index: { productId: 1 } (SINGLE)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  5. Verifying UnitSerialModel Indexes (§2.4)');
    console.log('────────────────────────────────────────────────────────────────────────');
    assert(hasIndex(serialIndexes, { serialNumber: 1 }, true), 'UnitSerial index: { serialNumber: 1 } (UNIQUE)');
    assert(hasIndex(serialIndexes, { status: 1 }), 'UnitSerial index: { status: 1 } (SINGLE)');
    assert(hasIndex(serialIndexes, { batchId: 1 }), 'UnitSerial index: { batchId: 1 } (SINGLE)');
    assert(hasIndex(serialIndexes, { productId: 1 }), 'UnitSerial index: { productId: 1 } (SINGLE)');
    assert(hasIndex(serialIndexes, { soldToCustomerId: 1 }), 'UnitSerial index: { soldToCustomerId: 1 } (SINGLE)');
    assert(hasIndex(serialIndexes, { warrantyExpiryDate: 1 }), 'UnitSerial index: { warrantyExpiryDate: 1 } (SINGLE)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  6. Verifying StockLedgerModel Indexes (§2.5)');
    console.log('────────────────────────────────────────────────────────────────────────');
    assert(hasIndex(ledgerIndexes, { sku: 1, createdAt: -1 }), 'StockLedger index: { sku: 1, createdAt: -1 } (COMPOUND CHRONOLOGICAL)');
    assert(hasIndex(ledgerIndexes, { batchId: 1, createdAt: -1 }), 'StockLedger index: { batchId: 1, createdAt: -1 } (COMPOUND CHRONOLOGICAL)');
    assert(hasIndex(ledgerIndexes, { warehouseId: 1, movementType: 1 }), 'StockLedger index: { warehouseId: 1, movementType: 1 } (COMPOUND)');
    assert(hasIndex(ledgerIndexes, { referenceNo: 1 }), 'StockLedger index: { referenceNo: 1 } (SINGLE)');

    console.log('\n────────────────────────────────────────────────────────────────────────');
    console.log('  7. CRUD Operations & Uniqueness Enforcement Tests');
    console.log('────────────────────────────────────────────────────────────────────────');

    const testSku = 'TEST-MED-USG-' + Math.floor(100000 + Math.random() * 900000);
    const testWarehouseId = new Types.ObjectId();
    const testUserId = new Types.ObjectId();

    // 7.1 Create Product
    const product = await ProductModel.create({
      sku: testSku,
      nameEn: 'Chison Q9 Color Doppler Ultrasound',
      nameBn: 'কাইসন কিউ৯ কালার ডপলার আল্ট্রাসাউন্ড',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.31.00',
      baseUom: 'Piece',
      brand: 'Chison',
      isMedical: true,
      isExpirable: true,
      minStockQty: 5,
      retailPrice: 1250000.0,
      showroomPrice: 1200000.0,
      resellerTierPrices: [
        { tier: 1, price: 1150000.0 },
        { tier: 2, price: 1100000.0 },
      ],
      barcodes: ['8941234567890'],
      seoContent: {
        metaTitle: 'Chison Q9 Ultrasound in Bangladesh',
        descriptionEn: 'High-resolution color doppler machine.',
      },
      isActive: true,
    });
    assert(product.sku === testSku, 'Product created successfully with uppercase SKU');
    assert(product.isMedical === true, 'Product isMedical flag persists correctly');

    // 7.2 Duplicate SKU rejection
    let duplicateSkuCaught = false;
    try {
      await ProductModel.create({
        sku: testSku, // duplicate
        nameEn: 'Another Ultrasound Machine',
        category: 'MEDICAL_EQUIPMENT',
        hsCode: '9018.31.00',
        baseUom: 'Piece',
        retailPrice: 1000000,
        showroomPrice: 950000,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        duplicateSkuCaught = true;
      }
    }
    assert(duplicateSkuCaught, 'Duplicate SKU correctly triggers E11000 unique key collision');

    // 7.3 Create UomConversion
    const uom = await UomConversionModel.create({
      productId: product._id,
      sku: product.sku,
      fromUom: 'Carton',
      toUom: 'Box',
      conversionFactor: 20,
      isActive: true,
    });
    assert(uom.conversionFactor === 20, 'UomConversion record created with conversionFactor: 20');

    // 7.4 Duplicate UOM conversion rejection
    let duplicateUomCaught = false;
    try {
      await UomConversionModel.create({
        productId: product._id,
        sku: product.sku,
        fromUom: 'Carton',
        toUom: 'Box',
        conversionFactor: 25,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        duplicateUomCaught = true;
      }
    }
    assert(duplicateUomCaught, 'Duplicate { productId, fromUom, toUom } triggers E11000 collision');

    // 7.5 Create ProductBatch
    const batch = await ProductBatchModel.create({
      productId: product._id,
      sku: product.sku,
      batchNumber: 'BATCH-2026-001',
      category: 'EXPIRY_CONTROLLED',
      manufacturingDate: new Date('2026-01-01'),
      expiryDate: new Date('2028-01-01'),
      baseUom: 'Piece',
      currentQty: 100,
      reservedQty: 10,
      unitCost: 850000.0,
      hasIndividualSerials: true,
      warrantyMonths: 24,
      warehouseId: testWarehouseId,
      locationStatus: 'ON_HAND',
    });
    assert(batch.currentQty === 100, 'ProductBatch created with available currentQty 100');
    assert(batch.unitCost === 850000.0, 'ProductBatch unitCost matches WAC value');

    // 7.6 Duplicate ProductBatch rejection ({ sku, batchNumber, warehouseId })
    let duplicateBatchCaught = false;
    try {
      await ProductBatchModel.create({
        productId: product._id,
        sku: product.sku,
        batchNumber: 'BATCH-2026-001',
        category: 'EXPIRY_CONTROLLED',
        baseUom: 'Piece',
        currentQty: 50,
        unitCost: 850000.0,
        warehouseId: testWarehouseId,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        duplicateBatchCaught = true;
      }
    }
    assert(duplicateBatchCaught, 'Duplicate { sku, batchNumber, warehouseId } triggers E11000 collision');

    // 7.7 Create UnitSerial
    const serialNo = 'SN-Q9-' + Math.floor(100000 + Math.random() * 900000);
    const serial = await UnitSerialModel.create({
      batchId: batch._id,
      productId: product._id,
      sku: product.sku,
      serialNumber: serialNo,
      status: 'IN_STOCK',
      qrCodeUrl: `https://api.sunbirdcorp.com/qr/${serialNo}`,
      warrantyExpiryDate: new Date('2028-01-01'),
    });
    assert(serial.serialNumber === serialNo, 'UnitSerial created with unique serial number');
    assert(serial.status === 'IN_STOCK', 'UnitSerial initial status is IN_STOCK');

    // 7.8 Duplicate UnitSerial rejection
    let duplicateSerialCaught = false;
    try {
      await UnitSerialModel.create({
        batchId: batch._id,
        productId: product._id,
        sku: product.sku,
        serialNumber: serialNo, // duplicate
        status: 'IN_STOCK',
      });
    } catch (err: any) {
      if (err.code === 11000) {
        duplicateSerialCaught = true;
      }
    }
    assert(duplicateSerialCaught, 'Duplicate serialNumber triggers E11000 unique key collision');

    // 7.9 Create StockLedger entry
    const ledger = await StockLedgerModel.create({
      sku: product.sku,
      batchId: batch._id,
      warehouseId: testWarehouseId,
      movementType: 'GRN_IN',
      qtyChange: 100,
      unitCost: 850000.0,
      referenceNo: 'GRN-2026-0001',
      referenceType: 'GRN',
      createdBy: testUserId,
    });
    assert(ledger.movementType === 'GRN_IN', 'StockLedger entry created with movementType: GRN_IN');
    assert(ledger.qtyChange === 100, 'StockLedger qtyChange is +100');

    // Cleanup test records
    await Promise.all([
      ProductModel.deleteOne({ _id: product._id }),
      UomConversionModel.deleteOne({ _id: uom._id }),
      ProductBatchModel.deleteOne({ _id: batch._id }),
      UnitSerialModel.deleteOne({ _id: serial._id }),
      StockLedgerModel.deleteOne({ _id: ledger._id }),
    ]);

  } catch (error) {
    console.error('Unexpected test fault in Product & Inventory models verification:', error);
    failed++;
  } finally {
    await disconnectDatabase().catch(() => {});
  }

  console.log('\n════════════════════════════════════════════════════════════════════════');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log('════════════════════════════════════════════════════════════════════════\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProductInventoryModelsVerificationSuite();
