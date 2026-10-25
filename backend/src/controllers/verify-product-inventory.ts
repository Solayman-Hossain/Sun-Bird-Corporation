import http from 'http';
import { Types } from 'mongoose';
import app from '../app';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { UomConversionModel } from '../models/UomConversion';
import { UnitSerialModel } from '../models/UnitSerial';
import { StockLedgerModel } from '../models/StockLedger';
import { UserModel } from '../models/User';
import { RoleModel } from '../models/Role';
import { TokenService } from '../services/TokenService';
import { UomService } from '../services/UomService';
import { InventoryBatchService } from '../services/InventoryBatchService';
import { StockLedgerService } from '../services/StockLedgerService';
import { SerialTrackingService } from '../services/SerialTrackingService';

async function runProductInventoryVerificationSuite() {
  console.log('════════════════════════════════════════════════════════════════════════');
  console.log('  PHASE 2: PRODUCT & INVENTORY ENGINE VERIFICATION SUITE');
  console.log('  (PROMPTS 11 – 16: MODELS, UOM, FEFO/WAC, LEDGER, SERIALS, ROUTES)');
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

  // 1. Connect to MongoDB
  await connectDatabase();

  // 2. Start HTTP test server on ephemeral port
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

    // ─── SETUP TEST USER & RBAC TOKEN ───
    console.log('--- Setting Up Test Auth & RBAC Permissions ---');
    const testRole = await RoleModel.create({
      roleName: `Inventory Admin ${runId}`,
      slug: `inv_admin_${runId}`,
      description: 'Role for inventory testing',
      permissions: [
        { module: 'products', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
        { module: 'inventory', actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'] },
      ],
      isActive: true,
    });

    const testUser = await UserModel.create({
      fullName: `Test Staff ${runId}`,
      email: `staff.${runId}@sunbirdcorp.com`,
      mobile: `01711${runId}`,
      userType: 'SUPER_ADMIN',
      roleId: testRole._id as Types.ObjectId,
      isActive: true,
    });

    const authToken = TokenService.generateAccessToken(testUser);
    const authHeaders = { Authorization: `Bearer ${authToken}` };

    const testWarehouseId = new Types.ObjectId();

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 1: UOM CONVERSION SERVICE (PROMPT 12)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 1: UOM Multi-Hop Conversion Service ---');
    const uomProduct = await ProductModel.create({
      sku: `UOM-PROD-${runId}`,
      nameEn: 'UOM Test Medical Syringe',
      nameBn: 'টেস্ট সিরিঞ্জ',
      category: 'MEDICAL_DISPOSABLES',
      hsCode: '9018.31.00',
      baseUom: 'Piece',
      retailPrice: 15.0,
      showroomPrice: 14.0,
      isMedical: true,
      isActive: true,
    });

    // 1 Carton = 20 Boxes, 1 Box = 10 Pieces -> 1 Carton = 200 Pieces
    await UomConversionModel.create([
      {
        productId: uomProduct._id,
        sku: uomProduct.sku,
        fromUom: 'Carton',
        toUom: 'Box',
        conversionFactor: 20,
      },
      {
        productId: uomProduct._id,
        sku: uomProduct.sku,
        fromUom: 'Box',
        toUom: 'Piece',
        conversionFactor: 10,
      },
    ]);

    const factorDirect = await UomService.getConversionFactor(uomProduct._id, 'Box', 'Piece');
    assert(factorDirect === 10, 'Direct conversion (Box -> Piece) returns 10');

    const factorMultiHop = await UomService.getConversionFactor(uomProduct._id, 'Carton', 'Piece');
    assert(factorMultiHop === 200, 'Multi-hop BFS conversion (Carton -> Box -> Piece) returns 200');

    const baseQty = await UomService.convertToBaseUom(uomProduct._id, 'Carton', 3);
    assert(baseQty === 600, 'convertToBaseUom: 3 Cartons = 600 Pieces');

    const fromBaseQty = await UomService.convertFromBaseUom(uomProduct._id, 'Carton', 600);
    assert(fromBaseQty === 3, 'convertFromBaseUom: 600 Pieces = 3 Cartons');

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 2: FEFO ALLOCATION & WAC ENGINE (PROMPT 13)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 2: FEFO Batch Allocation & Moving WAC ---');
    const fefoProduct = await ProductModel.create({
      sku: `FEFO-PROD-${runId}`,
      nameEn: 'FEFO Test Injection',
      nameBn: 'টেস্ট ইনজেকশন',
      category: 'PHARMACEUTICALS',
      hsCode: '3004.90.00',
      baseUom: 'Vial',
      retailPrice: 50.0,
      showroomPrice: 48.0,
      isMedical: true,
      isExpirable: true,
      isActive: true,
    });

    const now = new Date();
    const batchEarlier = await ProductBatchModel.create({
      productId: fefoProduct._id,
      sku: fefoProduct.sku,
      batchNumber: `BAT-EARLY-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days
      baseUom: 'Vial',
      currentQty: 50,
      reservedQty: 0,
      unitCost: 20.0,
      warehouseId: testWarehouseId,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      locationStatus: 'ON_HAND',
    });

    const batchLater = await ProductBatchModel.create({
      productId: fefoProduct._id,
      sku: fefoProduct.sku,
      batchNumber: `BAT-LATER-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000), // 180 days
      baseUom: 'Vial',
      currentQty: 100,
      reservedQty: 0,
      unitCost: 22.0,
      warehouseId: testWarehouseId,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      locationStatus: 'ON_HAND',
    });

    // Allocate 70 units -> should consume all 50 of batchEarlier and 20 of batchLater
    const allocation = await InventoryBatchService.allocateFefoStock(
      fefoProduct.sku,
      testWarehouseId.toString(),
      70
    );

    assert(allocation.length === 2, 'FEFO allocated across 2 batches');
    assert(
      allocation[0].batchId.toString() === batchEarlier._id.toString() &&
        allocation[0].allocatedQty === 50,
      'FEFO strictly allocated older batch first (50 units)'
    );
    assert(
      allocation[1].batchId.toString() === batchLater._id.toString() &&
        allocation[1].allocatedQty === 20,
      'FEFO allocated remainder from newer batch (20 units)'
    );

    // Verify database state after FEFO
    const updatedEarlier = await ProductBatchModel.findById(batchEarlier._id);
    const updatedLater = await ProductBatchModel.findById(batchLater._id);
    assert(updatedEarlier?.currentQty === 0, 'Earlier batch depleted to 0');
    assert(updatedLater?.currentQty === 80, 'Later batch depleted from 100 to 80');

    // Test Moving WAC Calculation: 100 @ 15.00 + 50 @ 18.50 -> (1500 + 925)/150 = 2425/150 = 16.1666... -> 16.17
    const newWac = InventoryBatchService.calculateNewWacCost(100, 15.0, 50, 18.5);
    assert(newWac === 16.17, `Moving WAC formula calculates 16.17 BDT (got: ${newWac})`);

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 3: STOCK LEDGER & ACID TRANSACTIONS (PROMPT 14)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 3: Stock Movement Ledger & ACID Transactions ---');
    const ledgerBatch = await ProductBatchModel.create({
      productId: fefoProduct._id,
      sku: fefoProduct.sku,
      batchNumber: `BAT-LEDGER-${runId}`,
      category: 'NON_EXPIRING',
      baseUom: 'Vial',
      currentQty: 100,
      reservedQty: 0,
      unitCost: 20.0,
      warehouseId: testWarehouseId,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      locationStatus: 'ON_HAND',
    });

    // 1. Successful GRN movement
    const movement = await StockLedgerService.recordMovement({
      sku: fefoProduct.sku,
      batchId: ledgerBatch._id,
      warehouseId: testWarehouseId,
      movementType: 'GRN',
      qtyChange: 50,
      unitCost: 25.0,
      referenceNo: `GRN-${runId}-001`,
      referenceType: 'GRN',
      createdBy: testUser._id,
      notes: 'Initial receipt verification',
    });

    assert(movement.movementType === 'GRN_IN', 'Movement type correctly canonicalized to GRN_IN');
    assert(movement.qtyChange === 50, 'Ledger qtyChange recorded as +50');

    const batchAfterGrn = await ProductBatchModel.findById(ledgerBatch._id);
    assert(batchAfterGrn?.currentQty === 150, 'Batch currentQty updated to 150');

    // 2. Aborted transaction test: verify zero database mutations
    let transactionAborted = false;
    const session = await (ProductBatchModel.db as any).startSession();
    session.startTransaction();
    try {
      await StockLedgerService.recordMovement(
        {
          sku: fefoProduct.sku,
          batchId: ledgerBatch._id,
          warehouseId: testWarehouseId,
          movementType: 'DISPATCH_CHALLAN',
          qtyChange: -30,
          referenceNo: `CH-${runId}-FAIL`,
          createdBy: testUser._id,
        },
        session
      );
      // Simulate mid-transaction business rule failure
      throw new Error('Simulated external payment/inventory failure');
    } catch {
      await session.abortTransaction();
      transactionAborted = true;
    } finally {
      session.endSession();
    }

    assert(transactionAborted, 'Transaction aborted as expected');
    const batchAfterAbort = await ProductBatchModel.findById(ledgerBatch._id);
    const ledgerAfterAbort = await StockLedgerModel.findOne({ referenceNo: `CH-${runId}-FAIL` });
    assert(batchAfterAbort?.currentQty === 150, 'ProductBatch unchanged after transaction abort (150)');
    assert(!ledgerAfterAbort, 'No record in StockLedger for aborted transaction');

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 4: SERIAL TRACKING & QR WARRANTY (PROMPT 15)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 4: Serial Tracking & Public QR Warranty ---');
    const ultrasoundProduct = await ProductModel.create({
      sku: `USG-MED-${runId}`,
      nameEn: 'Chison Q9 Color Doppler Ultrasound Machine',
      nameBn: 'কাইসন কিউ৯ আল্ট্রাসাউন্ড মেশিন',
      category: 'MEDICAL_EQUIPMENT',
      hsCode: '9018.12.00',
      baseUom: 'Unit',
      retailPrice: 1250000.0,
      showroomPrice: 1200000.0,
      isMedical: true,
      isActive: true,
    });

    const serialBatch = await ProductBatchModel.create({
      productId: ultrasoundProduct._id,
      sku: ultrasoundProduct.sku,
      batchNumber: `BAT-USG-${runId}`,
      category: 'NON_EXPIRING',
      baseUom: 'Unit',
      currentQty: 5,
      reservedQty: 0,
      unitCost: 800000.0,
      warehouseId: testWarehouseId,
      hasIndividualSerials: true,
      warrantyMonths: 24,
      locationStatus: 'ON_HAND',
    });

    const serialList = [
      `SN-USG-${runId}-001`,
      `SN-USG-${runId}-002`,
      `SN-USG-${runId}-003`,
      `SN-USG-${runId}-004`,
      `SN-USG-${runId}-005`,
    ];

    const generatedSerials = await SerialTrackingService.generateSerialsForBatch(
      serialBatch._id,
      serialList,
      24
    );

    assert(generatedSerials.length === 5, 'Generated 5 serials for medical equipment batch');
    assert(
      Boolean(generatedSerials[0].qrCodeUrl?.includes('https://sunbirdcorp.com/verify-serial/SN-USG-')),
      'QR code data points to https://sunbirdcorp.com/verify-serial/<serialNumber>'
    );
    assert(generatedSerials[0].status === 'IN_STOCK', 'Generated serial initial status is IN_STOCK');

    // Bind serial to customer sale challan
    const customerId = new Types.ObjectId().toString();
    const challanId = new Types.ObjectId().toString();
    const boundSerial = await SerialTrackingService.bindSerialToCustomer(
      serialList[0],
      customerId,
      challanId
    );

    assert(boundSerial.status === 'SOLD', 'Serial status transitioned to SOLD upon customer binding');
    assert(
      boundSerial.soldToCustomerId?.toString() === customerId,
      'Serial bound to designated customer ID'
    );
    assert(
      Boolean(boundSerial.warrantyExpiryDate && boundSerial.warrantyExpiryDate > new Date()),
      'Warranty expiry date calculated and in future'
    );

    // Verify via public verification service
    const verifyResult = await SerialTrackingService.verifySerial(serialList[0]);
    assert(verifyResult.isWarrantyActive === true, 'Public verifySerial returns isWarrantyActive: true');
    assert(verifyResult.productName === ultrasoundProduct.nameEn, 'Product name populated in verification');

    // ════════════════════════════════════════════════════════════════════════
    // TEST SECTION 5: CONTROLLERS & EXPRESS ROUTES (PROMPT 16)
    // ════════════════════════════════════════════════════════════════════════
    console.log('\n--- Test Section 5: Controllers & Express Routes ---');

    // 5.1 ERP Create Product via POST /api/v1/erp/products
    const createProductRes = await makeRequest(
      '/api/v1/erp/products',
      'POST',
      {
        sku: `MED-SYR-ERP-${runId}`,
        nameEn: 'ERP Disposable Syringe 10ml',
        nameBn: 'ডিসপোজেবল সিরিঞ্জ ১০ মি.লি.',
        category: 'MEDICAL_DISPOSABLES',
        hsCode: '9018.31.00',
        baseUom: 'Piece',
        brand: 'BD Medical',
        isMedical: true,
        isExpirable: true,
        minStockQty: 500,
        retailPrice: 18.0,
        showroomPrice: 16.0,
        resellerTierPrices: [{ tier: 1, price: 14.0 }],
        barcodes: [`8901234${runId}`],
      },
      authHeaders
    );

    assert(createProductRes.status === 201, 'POST /api/v1/erp/products returns 201 Created');
    assert(
      createProductRes.body?.data?.sku === `MED-SYR-ERP-${runId}`,
      'Created product SKU matches uppercase'
    );
    const createdProductId = createProductRes.body?.data?._id;

    // 5.2 Public Product Catalog Listing via GET /api/v1/public/products
    const publicListRes = await makeRequest(
      `/api/v1/public/products?search=ERP+Disposable+Syringe&category=MEDICAL_DISPOSABLES`,
      'GET'
    );
    assert(publicListRes.status === 200, 'GET /api/v1/public/products returns 200 OK');
    assert(
      publicListRes.body?.data?.length >= 1 &&
        publicListRes.body?.data[0]?.sku === `MED-SYR-ERP-${runId}`,
      'Storefront search and category filter returns registered product'
    );
    assert(
      publicListRes.body?.data[0]?.inStock === false,
      'Storefront correctly flags inStock: false before batches are added'
    );

    // 5.3 Public Product Detail via GET /api/v1/public/products/:idOrSku
    const publicDetailRes = await makeRequest(
      `/api/v1/public/products/MED-SYR-ERP-${runId}`,
      'GET'
    );
    assert(publicDetailRes.status === 200, 'GET /api/v1/public/products/:sku returns 200 OK');
    assert(
      publicDetailRes.body?.data?._id === createdProductId,
      'Detail lookup by SKU returns product matching ObjectId'
    );

    // 5.4 ERP Create Batch via POST /api/v1/erp/inventory/batches
    const createBatchRes = await makeRequest(
      '/api/v1/erp/inventory/batches',
      'POST',
      {
        productId: createdProductId,
        sku: `MED-SYR-ERP-${runId}`,
        batchNumber: `BAT-2026-${runId}`,
        category: 'EXPIRY_CONTROLLED',
        expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        currentQty: 500,
        unitCost: 10.5,
        warehouseId: testWarehouseId.toString(),
      },
      authHeaders
    );

    assert(createBatchRes.status === 201, 'POST /api/v1/erp/inventory/batches returns 201 Created');
    assert(
      createBatchRes.body?.data?.currentQty === 500,
      'Batch currentQty initialized to 500'
    );
    const createdBatchId = createBatchRes.body?.data?._id;

    // 5.5 ERP Stock Movement Adjustment via POST /api/v1/erp/inventory/movements
    const movementRes = await makeRequest(
      '/api/v1/erp/inventory/movements',
      'POST',
      {
        sku: `MED-SYR-ERP-${runId}`,
        batchId: createdBatchId,
        warehouseId: testWarehouseId.toString(),
        movementType: 'ADJUSTMENT',
        qtyChange: -25,
        unitCost: 10.5,
        referenceNo: `AUDIT-${runId}-001`,
        referenceType: 'PHYSICAL_ADJUSTMENT',
        notes: 'Warehouse audit deduction test',
      },
      authHeaders
    );

    assert(movementRes.status === 201, 'POST /api/v1/erp/inventory/movements returns 201 Created');
    assert(
      movementRes.body?.data?.batch?.currentQty === 475,
      'Batch currentQty decreased to 475 following deduction'
    );

    // 5.6 ERP List Batches with FEFO Sort via GET /api/v1/erp/inventory/batches
    const listBatchesRes = await makeRequest(
      `/api/v1/erp/inventory/batches?sku=MED-SYR-ERP-${runId}&sortByExpiry=fefo`,
      'GET',
      undefined,
      authHeaders
    );
    assert(listBatchesRes.status === 200, 'GET /api/v1/erp/inventory/batches returns 200 OK');
    assert(
      listBatchesRes.body?.data?.length === 1 &&
        listBatchesRes.body?.data[0]?.currentQty === 475,
      'Batch listing returns updated batch with currentQty 475'
    );

    // 5.7 Public Warranty Verification via POST /api/v1/public/warranty/verify
    const verifyWarrantyRes = await makeRequest(
      '/api/v1/public/warranty/verify',
      'POST',
      { serialNumber: serialList[0] }
    );
    assert(verifyWarrantyRes.status === 200, 'POST /api/v1/public/warranty/verify returns 200 OK');
    assert(
      verifyWarrantyRes.body?.data?.serialNumber === serialList[0] &&
        verifyWarrantyRes.body?.data?.isWarrantyActive === true,
      'Public warranty verification returns active warranty status'
    );

    // 5.8 Re-check public product catalog: should now show inStock: true
    const publicListAfterStock = await makeRequest(
      `/api/v1/public/products?search=ERP+Disposable+Syringe`,
      'GET'
    );
    assert(
      publicListAfterStock.body?.data[0]?.inStock === true &&
        publicListAfterStock.body?.data[0]?.availableStock === 475,
      'Public storefront catalog updates inStock to true and availableStock to 475'
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

runProductInventoryVerificationSuite().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
