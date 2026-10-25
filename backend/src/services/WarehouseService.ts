import { ClientSession, Types } from 'mongoose';
import { WarehouseModel, IWarehouse, WarehouseType } from '../models/Warehouse';
import { CounterService } from './CounterService';
import { ValidationError, NotFoundError, DuplicateKeyError } from '../errors/AppError';
import logger from '../config/logger';

export interface CreateWarehouseDTO {
  warehouseCode?: string;
  name: string;
  type: WarehouseType;
  address: string;
  district: string;
  isCentralHub?: boolean;
  contactPerson?: string;
  mobile?: string;
  capacityCbf?: number;
  binCount?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  geofenceRadiusMeters?: number;
  isActive?: boolean;
}

export interface UpdateWarehouseDTO {
  name?: string;
  type?: WarehouseType;
  address?: string;
  district?: string;
  isCentralHub?: boolean;
  contactPerson?: string;
  mobile?: string;
  capacityCbf?: number;
  binCount?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  geofenceRadiusMeters?: number;
  isActive?: boolean;
}

export interface WarehouseFilterDTO {
  type?: WarehouseType;
  district?: string;
  isCentralHub?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export class WarehouseService {
  /**
   * Registers a new warehouse, branch or showroom location with GPS coordinates.
   */
  public static async createWarehouse(
    dto: CreateWarehouseDTO,
    session?: ClientSession
  ): Promise<IWarehouse> {
    if (!dto.name || !dto.name.trim()) {
      throw new ValidationError('Warehouse name is required');
    }
    if (!dto.type || !['CENTRAL', 'BRANCH', 'OUTLET'].includes(dto.type)) {
      throw new ValidationError('Invalid warehouse type. Must be CENTRAL, BRANCH, or OUTLET');
    }
    if (!dto.address || !dto.address.trim()) {
      throw new ValidationError('Address is required');
    }
    if (!dto.district || !dto.district.trim()) {
      throw new ValidationError('District is required for geographical coverage tracking');
    }

    const warehouseCode =
      dto.warehouseCode?.trim().toUpperCase() ||
      (await CounterService.getNextSequence('WH', session));

    // Verify uniqueness
    const existing = await WarehouseModel.findOne({ warehouseCode }).session(session || null);
    if (existing) {
      throw new DuplicateKeyError('warehouseCode', warehouseCode);
    }

    // If marked central hub, ensure only one central hub exists if needed
    if (dto.isCentralHub) {
      await WarehouseModel.updateMany(
        { isCentralHub: true },
        { isCentralHub: false },
        { session }
      );
    }

    const location =
      dto.gpsLatitude !== undefined && dto.gpsLongitude !== undefined
        ? {
            type: 'Point' as const,
            coordinates: [dto.gpsLongitude, dto.gpsLatitude] as [number, number],
          }
        : undefined;

    const warehouse = new WarehouseModel({
      warehouseCode,
      name: dto.name.trim(),
      type: dto.type,
      address: dto.address.trim(),
      district: dto.district.trim(),
      isCentralHub: dto.isCentralHub ?? false,
      contactPerson: dto.contactPerson?.trim(),
      mobile: dto.mobile?.trim(),
      capacityCbf: dto.capacityCbf,
      binCount: dto.binCount,
      location,
      gpsLatitude: dto.gpsLatitude,
      gpsLongitude: dto.gpsLongitude,
      geofenceRadiusMeters: dto.geofenceRadiusMeters ?? 50,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
    });

    await warehouse.save({ session });
    logger.info(
      `Warehouse created: ${warehouse.warehouseCode} - ${warehouse.name} (${warehouse.district}, Type: ${warehouse.type})`
    );

    return warehouse;
  }

  /**
   * Updates warehouse details and coordinates.
   */
  public static async updateWarehouse(
    id: string | Types.ObjectId,
    dto: UpdateWarehouseDTO,
    session?: ClientSession
  ): Promise<IWarehouse> {
    const warehouse = await WarehouseModel.findById(id).session(session || null);
    if (!warehouse) {
      throw new NotFoundError(`Warehouse with ID ${id} not found`);
    }

    if (dto.name !== undefined) warehouse.name = dto.name.trim();
    if (dto.type !== undefined) warehouse.type = dto.type;
    if (dto.address !== undefined) warehouse.address = dto.address.trim();
    if (dto.district !== undefined) warehouse.district = dto.district.trim();
    if (dto.contactPerson !== undefined) warehouse.contactPerson = dto.contactPerson.trim();
    if (dto.mobile !== undefined) warehouse.mobile = dto.mobile.trim();
    if (dto.capacityCbf !== undefined) warehouse.capacityCbf = dto.capacityCbf;
    if (dto.binCount !== undefined) warehouse.binCount = dto.binCount;
    if (dto.geofenceRadiusMeters !== undefined) warehouse.geofenceRadiusMeters = dto.geofenceRadiusMeters;
    if (dto.isActive !== undefined) warehouse.isActive = dto.isActive;

    if (dto.gpsLatitude !== undefined || dto.gpsLongitude !== undefined) {
      const lat = dto.gpsLatitude !== undefined ? dto.gpsLatitude : warehouse.gpsLatitude;
      const lng = dto.gpsLongitude !== undefined ? dto.gpsLongitude : warehouse.gpsLongitude;

      warehouse.gpsLatitude = lat;
      warehouse.gpsLongitude = lng;

      if (lat !== undefined && lng !== undefined) {
        warehouse.location = {
          type: 'Point',
          coordinates: [lng, lat],
        };
      }
    }

    if (dto.isCentralHub !== undefined) {
      if (dto.isCentralHub) {
        await WarehouseModel.updateMany(
          { _id: { $ne: warehouse._id }, isCentralHub: true },
          { isCentralHub: false },
          { session }
        );
      }
      warehouse.isCentralHub = dto.isCentralHub;
    }

    await warehouse.save({ session });
    logger.info(`Warehouse updated: ${warehouse.warehouseCode}`);
    return warehouse;
  }

  /**
   * Lists warehouses with district and type filtering.
   */
  public static async listWarehouses(filter: WarehouseFilterDTO = {}) {
    const query: any = {};

    if (filter.type) query.type = filter.type;
    if (filter.district) {
      query.district = { $regex: filter.district.trim(), $options: 'i' };
    }
    if (filter.isCentralHub !== undefined) query.isCentralHub = filter.isCentralHub;
    if (filter.isActive !== undefined) query.isActive = filter.isActive;

    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [warehouses, total] = await Promise.all([
      WarehouseModel.find(query).sort({ district: 1, warehouseCode: 1 }).skip(skip).limit(limit).lean(),
      WarehouseModel.countDocuments(query),
    ]);

    return {
      warehouses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Queries warehouses by district to verify regional presence.
   */
  public static async getWarehousesByDistrict(district: string): Promise<IWarehouse[]> {
    return WarehouseModel.find({
      district: { $regex: `^${district.trim()}$`, $options: 'i' },
      isActive: true,
    }).sort({ warehouseCode: 1 });
  }

  /**
   * Finds a warehouse by ID.
   */
  public static async getWarehouseById(id: string | Types.ObjectId): Promise<IWarehouse> {
    const warehouse = await WarehouseModel.findById(id);
    if (!warehouse) {
      throw new NotFoundError(`Warehouse with ID ${id} not found`);
    }
    return warehouse;
  }
}

export default WarehouseService;
