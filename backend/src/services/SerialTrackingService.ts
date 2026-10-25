import { Types, ClientSession } from 'mongoose';
import { UnitSerialModel, IUnitSerial, UnitSerialStatus } from '../models/UnitSerial';
import { ProductBatchModel } from '../models/ProductBatch';
import { ProductModel } from '../models/Product';
import {
  NotFoundError,
  ValidationError,
  DuplicateKeyError,
} from '../errors/AppError';
import logger from '../config/logger';

export interface SerialVerificationResult {
  serialNumber: string;
  status: UnitSerialStatus;
  sku: string;
  productName: string;
  isMedical: boolean;
  warrantyExpiryDate?: Date;
  isWarrantyActive: boolean;
  soldAt?: Date;
  qrCodeUrl?: string;
}

export class SerialTrackingService {
  /**
   * Generates and bulk-inserts serial numbers for an individual medical equipment batch.
   *
   * @param batchId ProductBatch ObjectId
   * @param serialList Array of serial number strings
   * @param warrantyMonths Duration of manufacturer/dealer warranty in months
   * @param session Optional Mongoose transaction session
   * @returns Array of inserted IUnitSerial documents
   */
  public static async generateSerialsForBatch(
    batchId: string | Types.ObjectId,
    serialList: string[],
    warrantyMonths: number = 0,
    session?: ClientSession
  ): Promise<IUnitSerial[]> {
    if (!serialList || serialList.length === 0) {
      throw new ValidationError('At least one serial number is required for generation');
    }

    const bId = new Types.ObjectId(batchId);

    // 1. Fetch batch
    const batchQuery = ProductBatchModel.findById(bId);
    if (session) batchQuery.session(session);
    const batch = await batchQuery.exec();

    if (!batch) {
      throw new NotFoundError('ProductBatch', bId.toString());
    }

    // 2. Fetch product & verify isMedical: true
    const productQuery = ProductModel.findById(batch.productId);
    if (session) productQuery.session(session);
    const product = await productQuery.exec();

    if (!product) {
      throw new NotFoundError('Product', batch.productId.toString());
    }

    if (!product.isMedical) {
      logger.warn(
        `SerialTrackingService: Product '${product.sku}' is not marked as isMedical: true. Individual serial tracking is typically reserved for medical equipment.`
      );
    }

    // 3. Check for duplicates within input list
    const normalizedSerials = serialList.map((s) => s.trim());
    const uniqueInputSet = new Set(normalizedSerials);
    if (uniqueInputSet.size !== normalizedSerials.length) {
      throw new ValidationError('Input serial list contains duplicate serial numbers');
    }

    // 4. Validate system-wide uniqueness across unit_serials collection
    const existingSerialsQuery = UnitSerialModel.find({
      serialNumber: { $in: normalizedSerials },
    }).select('serialNumber');
    if (session) existingSerialsQuery.session(session);
    const existingSerials = await existingSerialsQuery.exec();

    if (existingSerials.length > 0) {
      const conflictSerial = existingSerials[0].serialNumber;
      throw new DuplicateKeyError('serialNumber', conflictSerial);
    }

    // 5. Construct unit_serials payloads with secure QR URL
    const records = normalizedSerials.map((serialNumber) => ({
      batchId: bId,
      productId: product._id,
      sku: product.sku,
      serialNumber,
      qrCodeUrl: `https://sunbirdcorp.com/verify-serial/${encodeURIComponent(serialNumber)}`,
      status: 'IN_STOCK' as UnitSerialStatus,
    }));

    let insertedDocs: IUnitSerial[];
    if (session) {
      insertedDocs = await UnitSerialModel.create(records, { session });
    } else {
      insertedDocs = await UnitSerialModel.create(records);
    }

    // 6. Update batch metadata flags
    batch.hasIndividualSerials = true;
    if (warrantyMonths > 0) {
      batch.warrantyMonths = warrantyMonths;
    }
    if (session) {
      await batch.save({ session });
    } else {
      await batch.save();
    }

    logger.info(
      `Generated ${insertedDocs.length} serial numbers for batch ${batch.batchNumber} (SKU: ${product.sku})`
    );

    return insertedDocs;
  }

  /**
   * Binds an individual equipment serial number to a customer upon order dispatch.
   *
   * @param serialNumber The unique equipment serial number
   * @param customerId Customer MongoDB ObjectId
   * @param challanId Delivery challan reference string
   * @param session Optional Mongoose transaction session
   * @returns Updated IUnitSerial document
   */
  public static async bindSerialToCustomer(
    serialNumber: string,
    customerId: string | Types.ObjectId,
    challanId: string,
    session?: ClientSession
  ): Promise<IUnitSerial> {
    const sNum = serialNumber.trim();
    const cId = new Types.ObjectId(customerId);

    const query = UnitSerialModel.findOne({ serialNumber: sNum });
    if (session) query.session(session);
    const serial = await query.exec();

    if (!serial) {
      throw new NotFoundError('UnitSerial', sNum);
    }

    if (serial.status !== 'IN_STOCK' && (serial.status as any) !== 'AVAILABLE') {
      throw new ValidationError(
        `Serial '${sNum}' cannot be dispatched: current status is '${serial.status}', expected 'IN_STOCK'`
      );
    }

    // Lookup batch to get configured warranty months
    const batchQuery = ProductBatchModel.findById(serial.batchId).select('warrantyMonths');
    if (session) batchQuery.session(session);
    const batch = await batchQuery.exec();

    const warrantyMonths = batch?.warrantyMonths || 12; // default 12 months if unspecified
    const soldAt = new Date();
    const warrantyExpiryDate = new Date(soldAt);
    warrantyExpiryDate.setMonth(warrantyExpiryDate.getMonth() + warrantyMonths);

    // Transition status to SOLD
    serial.status = 'SOLD';
    serial.soldToCustomerId = cId;
    serial.deliveryChallanNo = challanId.trim();
    serial.soldAt = soldAt;
    serial.warrantyExpiryDate = warrantyExpiryDate;

    if (session) {
      await serial.save({ session });
    } else {
      await serial.save();
    }

    logger.info(
      `Serial '${sNum}' bound to customer ${cId} via challan ${challanId} (Warranty through: ${warrantyExpiryDate.toISOString()})`
    );

    return serial;
  }

  /**
   * Public verification helper for warranty QR code scans.
   *
   * @param serialNumber The unique equipment serial number
   * @returns Detailed verification and warranty status payload
   */
  public static async verifySerial(
    serialNumber: string
  ): Promise<SerialVerificationResult> {
    const sNum = serialNumber.trim();
    const serial = await UnitSerialModel.findOne({ serialNumber: sNum }).lean();

    if (!serial) {
      throw new NotFoundError('Equipment Serial', sNum);
    }

    const product = await ProductModel.findById(serial.productId)
      .select('nameEn nameBn isMedical sku')
      .lean();

    const now = new Date();
    const isWarrantyActive =
      Boolean(serial.warrantyExpiryDate && serial.warrantyExpiryDate > now);

    return {
      serialNumber: serial.serialNumber,
      status: serial.status,
      sku: serial.sku,
      productName: product?.nameEn || serial.sku,
      isMedical: product?.isMedical ?? false,
      warrantyExpiryDate: serial.warrantyExpiryDate,
      isWarrantyActive,
      soldAt: serial.soldAt,
      qrCodeUrl: serial.qrCodeUrl,
    };
  }
}

export default SerialTrackingService;
