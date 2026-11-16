import { Types } from 'mongoose';
import { CategoryModel, ICategory } from '../models/Category';
import { ProductModel } from '../models/Product';
import { NotFoundError, ValidationError } from '../errors/AppError';
import { AuditLogService } from './AuditLogService';

export interface CreateCategoryDTO {
  nameEn: string;
  nameBn?: string;
  slug?: string;
  parentId?: string | null;
  iconUrl?: string;
  imageUrl?: string;
  descriptionEn?: string;
  descriptionBn?: string;
  displayOrder?: number;
  isHomepageVisible?: boolean;
  seoTitle?: string;
  metaDescription?: string;
}

export interface UpdateCategoryDTO extends Partial<CreateCategoryDTO> {
  isActive?: boolean;
}

export class CategoryService {
  /**
   * Helper: Generate URL-safe slug
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Helper: Detect circular parent-child dependency using graph traversal
   */
  public static async detectCircularCategory(
    categoryId: string | Types.ObjectId,
    targetParentId: string | Types.ObjectId | null
  ): Promise<boolean> {
    if (!targetParentId) return false;
    if (String(categoryId) === String(targetParentId)) return true;

    const visited = new Set<string>();
    visited.add(String(categoryId));

    let currentParentId: string | null = String(targetParentId);
    while (currentParentId) {
      if (visited.has(currentParentId)) {
        return true; // Circular dependency detected!
      }
      visited.add(currentParentId);

      const parentCat: any = await CategoryModel.findById(currentParentId).select('parentId').lean();
      if (!parentCat || !parentCat.parentId) {
        break;
      }
      currentParentId = String(parentCat.parentId);
    }

    return false;
  }

  /**
   * List all categories with product counts
   */
  public static async listCategories(query: {
    isActive?: boolean;
    parentId?: string | null;
    isHomepageVisible?: boolean;
  } = {}): Promise<any[]> {
    const filter: Record<string, any> = {};
    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if (query.parentId !== undefined) filter.parentId = query.parentId ? new Types.ObjectId(query.parentId) : null;
    if (query.isHomepageVisible !== undefined) filter.isHomepageVisible = query.isHomepageVisible;

    const categories = await CategoryModel.find(filter)
      .sort({ displayOrder: 1, nameEn: 1 })
      .lean();

    // Aggregate actual product counts from ProductModel
    const productCounts = await ProductModel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    productCounts.forEach((pc) => {
      countMap.set(String(pc._id).toLowerCase(), pc.count);
    });

    return categories.map((cat) => ({
      ...cat,
      productCount:
        countMap.get(cat.nameEn.toLowerCase()) ||
        countMap.get(cat.slug.toLowerCase()) ||
        cat.productCount ||
        0,
    }));
  }

  /**
   * Get Category Tree (Hierarchical)
   */
  public static async getCategoryTree(): Promise<any[]> {
    const all = await this.listCategories();
    const map = new Map<string, any>();
    const roots: any[] = [];

    all.forEach((item) => {
      map.set(String(item._id), { ...item, children: [] });
    });

    all.forEach((item) => {
      const node = map.get(String(item._id));
      if (item.parentId && map.has(String(item.parentId))) {
        map.get(String(item.parentId)).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Create new Category
   */
  public static async createCategory(
    dto: CreateCategoryDTO,
    actorId?: string
  ): Promise<ICategory> {
    const slug = dto.slug ? this.generateSlug(dto.slug) : this.generateSlug(dto.nameEn);

    // Check slug uniqueness
    const existing = await CategoryModel.findOne({ slug });
    if (existing) {
      throw new ValidationError(`Category with slug '${slug}' already exists.`);
    }

    let ancestors: Types.ObjectId[] = [];
    let parentObjectId: Types.ObjectId | null = null;

    if (dto.parentId) {
      parentObjectId = new Types.ObjectId(dto.parentId);
      const parent = await CategoryModel.findById(parentObjectId);
      if (!parent) {
        throw new NotFoundError(`Parent category '${dto.parentId}' not found.`);
      }
      ancestors = [...parent.ancestors, parent._id];
    }

    const category = new CategoryModel({
      nameEn: dto.nameEn,
      nameBn: dto.nameBn,
      slug,
      parentId: parentObjectId,
      ancestors,
      iconUrl: dto.iconUrl,
      imageUrl: dto.imageUrl,
      descriptionEn: dto.descriptionEn,
      descriptionBn: dto.descriptionBn,
      displayOrder: dto.displayOrder || 0,
      isHomepageVisible: dto.isHomepageVisible !== false,
      isActive: true,
      seoTitle: dto.seoTitle || dto.nameEn,
      metaDescription: dto.metaDescription || dto.descriptionEn,
    });

    await category.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'CATEGORY_CREATE',
        targetCollection: 'categories',
        targetId: category._id,
        actorId: new Types.ObjectId(actorId),
        diff: { nameEn: dto.nameEn, slug },
        module: 'PRODUCTS',
      });
    }

    return category;
  }

  /**
   * Update Category
   */
  public static async updateCategory(
    id: string,
    dto: UpdateCategoryDTO,
    actorId?: string
  ): Promise<ICategory> {
    const category = await CategoryModel.findById(id);
    if (!category) {
      throw new NotFoundError(`Category '${id}' not found.`);
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId) {
        const isCircular = await this.detectCircularCategory(id, dto.parentId);
        if (isCircular) {
          throw new ValidationError(
            'Circular parent-child category dependency detected. A category cannot be its own ancestor.'
          );
        }
        category.parentId = new Types.ObjectId(dto.parentId);
        const parent = await CategoryModel.findById(dto.parentId);
        category.ancestors = parent ? [...parent.ancestors, parent._id] : [];
      } else {
        category.parentId = null;
        category.ancestors = [];
      }
    }

    if (dto.nameEn) category.nameEn = dto.nameEn;
    if (dto.nameBn !== undefined) category.nameBn = dto.nameBn;
    if (dto.slug) category.slug = this.generateSlug(dto.slug);
    if (dto.iconUrl !== undefined) category.iconUrl = dto.iconUrl;
    if (dto.imageUrl !== undefined) category.imageUrl = dto.imageUrl;
    if (dto.descriptionEn !== undefined) category.descriptionEn = dto.descriptionEn;
    if (dto.descriptionBn !== undefined) category.descriptionBn = dto.descriptionBn;
    if (dto.displayOrder !== undefined) category.displayOrder = dto.displayOrder;
    if (dto.isHomepageVisible !== undefined) category.isHomepageVisible = dto.isHomepageVisible;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;
    if (dto.seoTitle !== undefined) category.seoTitle = dto.seoTitle;
    if (dto.metaDescription !== undefined) category.metaDescription = dto.metaDescription;

    await category.save();

    if (actorId) {
      await AuditLogService.record({
        action: 'CATEGORY_UPDATE',
        targetCollection: 'categories',
        targetId: category._id,
        actorId: new Types.ObjectId(actorId),
        diff: dto,
        module: 'PRODUCTS',
      });
    }

    return category;
  }

  /**
   * Safe Delete / Archive Category
   */
  public static async deleteCategory(id: string, actorId?: string): Promise<boolean> {
    const category = await CategoryModel.findById(id);
    if (!category) throw new NotFoundError(`Category '${id}' not found.`);

    // Check if products exist in category
    const productCount = await ProductModel.countDocuments({
      $or: [{ category: category.nameEn }, { categoryId: category._id }],
    });

    if (productCount > 0) {
      // Soft-archive instead of dropping
      category.isActive = false;
      await category.save();
      return true;
    }

    await CategoryModel.deleteOne({ _id: category._id });

    if (actorId) {
      await AuditLogService.record({
        action: 'CATEGORY_DELETE',
        targetCollection: 'categories',
        targetId: category._id,
        actorId: new Types.ObjectId(actorId),
        diff: { nameEn: category.nameEn },
        module: 'PRODUCTS',
      });
    }

    return true;
  }

  /**
   * Seed standard healthcare categories idempotently
   */
  public static async seedDefaultCategories(): Promise<number> {
    const defaults = [
      {
        nameEn: 'Surgical Consumables',
        nameBn: 'সার্জিক্যাল সামগ্রী ও ডিসপোজেবল',
        slug: 'surgical-consumables',
        iconUrl: 'Scissors',
        displayOrder: 1,
        descriptionEn: 'IV cannulas, syringes, surgical gloves, blades, and single-use hospital supplies',
      },
      {
        nameEn: 'Home Diagnostics',
        nameBn: 'হোম ডায়াগনস্টিক ডিভাইস',
        slug: 'home-diagnostics',
        iconUrl: 'Activity',
        displayOrder: 2,
        descriptionEn: 'Blood pressure monitors, glucometers, digital thermometers, and pulse oximeters',
      },
      {
        nameEn: 'Critical Care & Respiratory',
        nameBn: 'রেসপিরেটরি ও ক্রিটিক্যাল কেয়ার',
        slug: 'critical-care-respiratory',
        iconUrl: 'Wind',
        displayOrder: 3,
        descriptionEn: 'Oxygen concentrators, BiPAP/CPAP machines, nebulizers, and ICU flowmeters',
      },
      {
        nameEn: 'Hospital Furniture & Accessories',
        nameBn: 'হাসপাতাল ফার্নিচার ও ট্রলি',
        slug: 'hospital-furniture',
        iconUrl: 'Bed',
        displayOrder: 4,
        descriptionEn: 'ICU electric beds, surgical tables, patient monitors, and drip stands',
      },
      {
        nameEn: 'Diagnostic Imaging & Cardiology',
        nameBn: 'ডায়াগনস্টিক ইমেজিং ও কার্ডিওলজি',
        slug: 'diagnostic-imaging',
        iconUrl: 'Eye',
        displayOrder: 5,
        descriptionEn: 'Color Doppler ultrasound machines, 12-channel ECG, and cardiology supplies',
      },
      {
        nameEn: 'PPE & Infection Control',
        nameBn: 'পিপিই ও ইনফেকশন কন্ট্রোল',
        slug: 'ppe-infection-control',
        iconUrl: 'ShieldCheck',
        displayOrder: 6,
        descriptionEn: 'Autoclave sterilizers, medical masks, isolation gowns, and sanitizers',
      },
      {
        nameEn: 'Rehabilitation & Mobility',
        nameBn: 'রিহ্যাবিলিটেশন ও হুইলচেয়ার',
        slug: 'rehabilitation-mobility',
        iconUrl: 'Accessibility',
        displayOrder: 7,
        descriptionEn: 'Orthopedic wheelchairs, commode chairs, walking frames, and physiocare',
      },
    ];

    let count = 0;
    for (const d of defaults) {
      const exists = await CategoryModel.findOne({ slug: d.slug });
      if (!exists) {
        await CategoryModel.create({
          nameEn: d.nameEn,
          nameBn: d.nameBn,
          slug: d.slug,
          iconUrl: d.iconUrl,
          displayOrder: d.displayOrder,
          descriptionEn: d.descriptionEn,
          isActive: true,
          isHomepageVisible: true,
        });
        count++;
      }
    }

    return count;
  }
}
