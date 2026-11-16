import { Types } from 'mongoose';
import { ProductAttributeModel, IProductAttribute } from '../models/ProductAttribute';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { AuditLogService } from './AuditLogService';

export interface CreateAttributeDTO {
  name: string;
  code?: string;
  values: string[];
  displayOrder?: number;
}

export class ProductAttributeService {
  public static async listAttributes(query: { isActive?: boolean } = {}): Promise<IProductAttribute[]> {
    const filter: Record<string, any> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    return ProductAttributeModel.find(filter).sort({ displayOrder: 1, name: 1 });
  }

  public static async createAttribute(dto: CreateAttributeDTO, actorId?: string): Promise<IProductAttribute> {
    const code = (dto.code || dto.name)
      .toLowerCase()
      .trim()
      .replace(/[^\w-]/g, '_');

    const existing = await ProductAttributeModel.findOne({ code });
    if (existing) {
      throw new ValidationError(`Attribute with code '${code}' already exists.`);
    }

    const attr = new ProductAttributeModel({
      name: dto.name,
      code,
      values: dto.values || [],
      displayOrder: dto.displayOrder || 0,
      isActive: true,
    });

    await attr.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'ATTRIBUTE_CREATE',
        targetCollection: 'product_attributes',
        targetId: attr._id,
        actorId: new Types.ObjectId(actorId),
        diff: { name: dto.name, code },
        module: 'PRODUCTS',
      });
    }

    return attr;
  }

  public static async updateAttribute(
    id: string,
    dto: Partial<CreateAttributeDTO> & { isActive?: boolean },
    actorId?: string
  ): Promise<IProductAttribute> {
    const attr = await ProductAttributeModel.findById(id);
    if (!attr) throw new NotFoundError(`Attribute '${id}' not found.`);

    if (dto.name) attr.name = dto.name;
    if (dto.values) attr.values = dto.values;
    if (dto.displayOrder !== undefined) attr.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) attr.isActive = dto.isActive;

    await attr.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'ATTRIBUTE_UPDATE',
        targetCollection: 'product_attributes',
        targetId: attr._id,
        actorId: new Types.ObjectId(actorId),
        diff: dto,
        module: 'PRODUCTS',
      });
    }

    return attr;
  }

  public static async seedDefaultAttributes(): Promise<number> {
    const defaults = [
      { name: 'Color / Gauge', code: 'color_gauge', values: ['Pink (20G)', 'Blue (22G)', 'Yellow (24G)', 'Green (18G)', 'Grey (16G)', 'Orange (14G)'] },
      { name: 'Size', code: 'size', values: ['Small', 'Medium', 'Large', 'Extra Large', 'Standard', 'Universal'] },
      { name: 'Capacity / Flow Rate', code: 'capacity', values: ['5 Liters/min', '10 Liters/min', '60 ml/min', '36 ml/min', '100 ml'] },
      { name: 'Material', code: 'material', values: ['FEP Teflon', 'Latex-Free PVC', 'Medical Grade Polypropylene', 'Stainless Steel 316', 'Aluminum Alloy'] },
      { name: 'Packaging Type', code: 'packaging', values: ['Single Sterile Blister Pack', 'Box of 50 Pcs', 'Box of 100 Pcs', 'Carton of 1000 Pcs', 'Individually Boxed'] },
    ];

    let count = 0;
    for (const d of defaults) {
      const exists = await ProductAttributeModel.findOne({ code: d.code });
      if (!exists) {
        await ProductAttributeModel.create({
          name: d.name,
          code: d.code,
          values: d.values,
          isActive: true,
          displayOrder: count + 1,
        });
        count++;
      }
    }
    return count;
  }
}
