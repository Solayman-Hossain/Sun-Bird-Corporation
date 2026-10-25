import { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { ProductBatchModel } from '../models/ProductBatch';
import { PosCheckoutService } from '../services/PosCheckoutService';
import { OrderModel } from '../models/Order';
import { DeliveryChallanModel } from '../models/DeliveryChallan';
import { SalesInvoiceModel } from '../models/SalesInvoice';
import { JournalEntryModel } from '../models/JournalEntry';
import { UserModel } from '../models/User';
import { WarehouseModel } from '../models/Warehouse';

describe('POS Showroom Checkout & Single-Transaction Engine Test Suite (Prompt 54)', () => {
  const runId = Date.now().toString().slice(-6);

  afterAll(async () => {
    await UserModel.deleteMany({ email: new RegExp(runId) });
    await WarehouseModel.deleteMany({ warehouseCode: new RegExp(runId) });
    await ProductModel.deleteMany({ sku: new RegExp(runId) });
    await ProductBatchModel.deleteMany({ sku: new RegExp(runId) });
    await OrderModel.deleteMany({ shippingAddress: new RegExp(runId) });
    await DeliveryChallanModel.deleteMany({ companyBin: new RegExp(runId) });
    await SalesInvoiceModel.deleteMany({});
    await JournalEntryModel.deleteMany({});
  });

  it('should process POS checkout atomically creating Order, Challan, Invoice, and JV', async () => {
    const warehouse = await WarehouseModel.create({
      warehouseCode: `WH-${runId}`,
      name: `Banani Showroom ${runId}`,
      type: 'OUTLET',
      address: 'Plot 45, Road 11, Banani, Dhaka',
      district: 'Dhaka',
      isCentralHub: false,
      isActive: true,
    });
    const showroomWarehouseId = warehouse._id;

    const cashier = await UserModel.create({
      mobile: `0177${runId}01`,
      fullName: `POS Cashier ${runId}`,
      email: `cashier.${runId}@sunbird.com`,
      passwordHash: 'dummy_hash',
      userType: 'STAFF',
      warehouseId: showroomWarehouseId,
      isActive: true,
      isMobileVerified: true,
    });

    const product = await ProductModel.create({
      sku: `POS-SKU-${runId}`,
      nameEn: `Digital Thermometer ${runId}`,
      brand: 'Sun Bird Health',
      category: 'Diagnostic Devices',
      hsCode: '90251900',
      baseUom: 'PCS',
      retailPrice: 500,
      showroomPrice: 480,
      minStockQty: 5,
      isMedical: true,
      isExpirable: false,
      isActive: true,
    });

    const batch = await ProductBatchModel.create({
      productId: product._id,
      sku: product.sku,
      batchNumber: `POS-BAT-${runId}`,
      category: 'NON_EXPIRING',
      baseUom: 'PCS',
      currentQty: 20,
      reservedQty: 0,
      unitCost: 250,
      hasIndividualSerials: false,
      warrantyMonths: 6,
      warehouseId: showroomWarehouseId,
      locationStatus: 'ON_HAND',
    });

    const checkoutDTO = {
      cashierId: cashier._id.toString(),
      customerId: new Types.ObjectId().toString(),
      showroomWarehouseId: showroomWarehouseId.toString(),
      items: [
        {
          productId: product._id.toString(),
          sku: product.sku,
          batchNumber: batch.batchNumber,
          quantity: 2,
          qty: 2,
          unitPrice: 480,
          vatRate: 0,
          sdRate: 0,
        },
      ],
      paymentMethod: 'CASH' as const,
      paidAmount: 1000,
      customerName: `Walk-in Customer ${runId}`,
      customerPhone: '01711223344',
      shippingAddress: `Banani Showroom POS ${runId}`,
    };

    const result = await PosCheckoutService.processPosCheckout(checkoutDTO);

    expect(result.orderNo).toBeDefined();
    expect(result.challanNo).toBeDefined();
    expect(result.invoiceNo).toBeDefined();
    expect(result.journalVoucherNo).toBeDefined();
    expect(result.grandTotal).toBe(960);

    // Verify batch stock decremented
    const updatedBatch = await ProductBatchModel.findById(batch._id);
    expect(updatedBatch?.currentQty).toBe(18); // 20 - 2 = 18
  });
});
