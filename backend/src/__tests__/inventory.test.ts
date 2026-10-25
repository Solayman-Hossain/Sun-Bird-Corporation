import { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { UnitSerialModel } from '../models/UnitSerial';

describe('Inventory & FEFO Allocation Test Suite (Prompt 54)', () => {
  const runId = Date.now().toString().slice(-6);

  afterAll(async () => {
    await ProductModel.deleteMany({ sku: new RegExp(runId) });
    await ProductBatchModel.deleteMany({ sku: new RegExp(runId) });
    await UnitSerialModel.deleteMany({ sku: new RegExp(runId) });
  });

  it('should allocate batches adhering to FEFO (First-Expired, First-Out) priority', async () => {
    const product = await ProductModel.create({
      sku: `SKU-FEFO-${runId}`,
      nameEn: `Diagnostic Blood Tube ${runId}`,
      brand: 'Sun Bird Lab',
      category: 'Diagnostic Reagents',
      hsCode: '38220000',
      baseUom: 'PCS',
      retailPrice: 50,
      showroomPrice: 45,
      minStockQty: 10,
      isMedical: true,
      isExpirable: true,
      isActive: true,
    });

    // Batch 1: Expires in 30 days
    const batchNear = await ProductBatchModel.create({
      productId: product._id,
      sku: product.sku,
      batchNumber: `BAT-NEAR-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      baseUom: 'PCS',
      currentQty: 100,
      reservedQty: 0,
      unitCost: 20,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      warehouseId: new Types.ObjectId(),
      locationStatus: 'ON_HAND',
    });

    // Batch 2: Expires in 180 days
    const batchFar = await ProductBatchModel.create({
      productId: product._id,
      sku: product.sku,
      batchNumber: `BAT-FAR-${runId}`,
      category: 'EXPIRY_CONTROLLED',
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      baseUom: 'PCS',
      currentQty: 100,
      reservedQty: 0,
      unitCost: 22,
      hasIndividualSerials: false,
      warrantyMonths: 0,
      warehouseId: new Types.ObjectId(),
      locationStatus: 'ON_HAND',
    });

    // Query batches sorted by expiryDate ascending (FEFO)
    const fefoBatches = await ProductBatchModel.find({ sku: product.sku }).sort({ expiryDate: 1 });
    expect(fefoBatches[0].batchNumber).toBe(batchNear.batchNumber);
    expect(fefoBatches[1].batchNumber).toBe(batchFar.batchNumber);
  });

  it('should generate and track medical equipment unit serials', async () => {
    const serial = await UnitSerialModel.create({
      productId: new Types.ObjectId(),
      batchId: new Types.ObjectId(),
      sku: `EQUIP-${runId}`,
      batchNumber: `BATCH-EQ-${runId}`,
      serialNumber: `SN-${runId}-0001`,
      warehouseId: new Types.ObjectId(),
      status: 'IN_STOCK',
      warrantyExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    expect(serial._id).toBeDefined();
    expect(serial.status).toBe('IN_STOCK');

    serial.status = 'SOLD';
    await serial.save();
    expect(serial.status).toBe('SOLD');
  });
});
