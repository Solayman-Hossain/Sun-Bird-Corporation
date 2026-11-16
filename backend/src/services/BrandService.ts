import { Types } from 'mongoose';
import { BrandModel, IBrand } from '../models/Brand';
import { ProductModel } from '../models/Product';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { AuditLogService } from './AuditLogService';

export interface CreateBrandDTO {
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  countryOfOrigin?: string;
  displayOrder?: number;
  seoTitle?: string;
  metaDescription?: string;
}

export interface UpdateBrandDTO extends Partial<CreateBrandDTO> {
  isActive?: boolean;
}

export class BrandService {
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  public static async listBrands(query: { isActive?: boolean } = {}): Promise<any[]> {
    const filter: Record<string, any> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    const brands = await BrandModel.find(filter)
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // Aggregate product counts
    const productCounts = await ProductModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    productCounts.forEach((pc) => {
      if (pc._id) countMap.set(String(pc._id).toLowerCase(), pc.count);
    });

    return brands.map((b) => ({
      ...b,
      productCount:
        countMap.get(b.name.toLowerCase()) ||
        countMap.get(b.slug.toLowerCase()) ||
        b.productCount ||
        0,
    }));
  }

  public static async createBrand(dto: CreateBrandDTO, actorId?: string): Promise<IBrand> {
    const slug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.name);
    const existing = await BrandModel.findOne({ slug });
    if (existing) {
      throw new ValidationError(`Brand with slug '${slug}' already exists.`);
    }

    const brand = new BrandModel({
      name: dto.name,
      slug,
      logoUrl: dto.logoUrl,
      description: dto.description,
      website: dto.website,
      countryOfOrigin: dto.countryOfOrigin || 'Bangladesh',
      displayOrder: dto.displayOrder || 0,
      isActive: true,
      seoTitle: dto.seoTitle || dto.name,
      metaDescription: dto.metaDescription || dto.description,
    });

    await brand.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'BRAND_CREATE',
        targetCollection: 'brands',
        targetId: brand._id,
        actorId: new Types.ObjectId(actorId),
        diff: { name: dto.name, slug },
        module: 'PRODUCTS',
      });
    }

    return brand;
  }

  public static async updateBrand(id: string, dto: UpdateBrandDTO, actorId?: string): Promise<IBrand> {
    const brand = await BrandModel.findById(id);
    if (!brand) throw new NotFoundError(`Brand '${id}' not found.`);

    if (dto.name) brand.name = dto.name;
    if (dto.slug) brand.slug = this.generateSlug(dto.slug);
    if (dto.logoUrl !== undefined) brand.logoUrl = dto.logoUrl;
    if (dto.description !== undefined) brand.description = dto.description;
    if (dto.website !== undefined) brand.website = dto.website;
    if (dto.countryOfOrigin !== undefined) brand.countryOfOrigin = dto.countryOfOrigin;
    if (dto.displayOrder !== undefined) brand.displayOrder = dto.displayOrder;
    if (dto.isActive !== undefined) brand.isActive = dto.isActive;
    if (dto.seoTitle !== undefined) brand.seoTitle = dto.seoTitle;
    if (dto.metaDescription !== undefined) brand.metaDescription = dto.metaDescription;

    await brand.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'BRAND_UPDATE',
        targetCollection: 'brands',
        targetId: brand._id,
        actorId: new Types.ObjectId(actorId),
        diff: dto,
        module: 'PRODUCTS',
      });
    }

    return brand;
  }

  public static async deleteBrand(id: string, actorId?: string): Promise<boolean> {
    const brand = await BrandModel.findById(id);
    if (!brand) throw new NotFoundError(`Brand '${id}' not found.`);

    const productCount = await ProductModel.countDocuments({
      $or: [{ brand: brand.name }, { brandId: brand._id }],
    });

    if (productCount > 0) {
      // Archive safely if products exist
      brand.isActive = false;
      await brand.save();
      return true;
    }

    await BrandModel.deleteOne({ _id: brand._id });

    if (actorId) {
      await AuditLogService.record({
        action: 'BRAND_DELETE',
        targetCollection: 'brands',
        targetId: brand._id,
        actorId: new Types.ObjectId(actorId),
        diff: { name: brand.name },
        module: 'PRODUCTS',
      });
    }

    return true;
  }

  public static async seedDefaultBrands(): Promise<number> {
    const defaults = [
      { name: 'Sun Bird Med', slug: 'sun-bird-med', country: 'Bangladesh', displayOrder: 1 },
      { name: 'Omron Healthcare', slug: 'omron-healthcare', country: 'Japan', displayOrder: 2 },
      { name: 'BMC Medical', slug: 'bmc-medical', country: 'China', displayOrder: 3 },
      { name: 'Yuwell Medical', slug: 'yuwell-medical', country: 'China', displayOrder: 4 },
      { name: 'Mindray Bio-Medical', slug: 'mindray-bio-medical', country: 'China', displayOrder: 5 },
      { name: 'Contec Medical Systems', slug: 'contec-medical', country: 'China', displayOrder: 6 },
      { name: 'Nipro Medical', slug: 'nipro-medical', country: 'Japan', displayOrder: 7 },
      { name: 'B. Braun', slug: 'b-braun', country: 'Germany', displayOrder: 8 },
    ];

    let count = 0;
    for (const b of defaults) {
      const exists = await BrandModel.findOne({ slug: b.slug });
      if (!exists) {
        await BrandModel.create({
          name: b.name,
          slug: b.slug,
          countryOfOrigin: b.country,
          displayOrder: b.displayOrder,
          isActive: true,
        });
        count++;
      }
    }
    return count;
  }
}
