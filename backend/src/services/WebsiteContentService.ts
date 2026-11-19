import { Types } from 'mongoose';
import { WebsiteContentModel, IWebsiteContent } from '../models/WebsiteContent';
import { LandingPageModel, ILandingPage } from '../models/LandingPage';
import { NavigationMenuModel, INavigationMenu } from '../models/NavigationMenu';
import { AuditLogService } from './AuditLogService';
import logger from '../config/logger';

export class WebsiteContentService {
  // ── CMS Website Content (Pages, Policies, FAQs, Sections) ──

  /**
   * Get all CMS content documents
   */
  public static async getAllContent(
    organizationId: Types.ObjectId | string,
    filters: { contentType?: string; language?: string } = {}
  ): Promise<IWebsiteContent[]> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };
    if (filters.contentType && filters.contentType !== 'ALL') query.contentType = filters.contentType;
    if (filters.language) query.language = filters.language;

    return WebsiteContentModel.find(query).sort({ contentType: 1, contentKey: 1 });
  }

  /**
   * Get content by key (e.g. "ABOUT_US", "RETURN_POLICY")
   */
  public static async getContentByKey(
    organizationId: Types.ObjectId | string,
    contentKey: string,
    language = 'bn'
  ): Promise<IWebsiteContent | null> {
    return WebsiteContentModel.findOne({
      organizationId: new Types.ObjectId(String(organizationId)),
      contentKey: contentKey.toUpperCase().trim(),
      language,
    });
  }

  /**
   * Create or update content with automatic version history archiving
   */
  public static async upsertContent(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: {
      contentKey: string;
      title: string;
      contentType: 'PAGE' | 'SECTION' | 'POLICY' | 'FAQ' | 'FOOTER' | 'HEADER' | 'ANNOUNCEMENT';
      body: string;
      language?: 'bn' | 'en';
      changeSummary?: string;
      status?: 'DRAFT' | 'APPROVED' | 'PUBLISHED';
      seoTitle?: string;
      seoDescription?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<IWebsiteContent> {
    const orgId = new Types.ObjectId(String(organizationId));
    const lang = payload.language || 'bn';
    const key = payload.contentKey.toUpperCase().trim();

    let doc = await WebsiteContentModel.findOne({ organizationId: orgId, contentKey: key, language: lang });

    if (!doc) {
      doc = new WebsiteContentModel({
        organizationId: orgId,
        contentKey: key,
        title: payload.title,
        contentType: payload.contentType,
        body: payload.body,
        language: lang,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            title: payload.title,
            body: payload.body,
            changedBy: new Types.ObjectId(String(userId)),
            changeSummary: payload.changeSummary || 'Initial document creation',
            savedAt: new Date(),
          },
        ],
        status: payload.status || 'PUBLISHED',
        publishedAt: payload.status === 'PUBLISHED' ? new Date() : undefined,
        seoTitle: payload.seoTitle,
        seoDescription: payload.seoDescription,
        metadata: payload.metadata,
        createdBy: new Types.ObjectId(String(userId)),
      });
      await doc.save();
    } else {
      // Archive current version into history before overwriting
      doc.versions.push({
        versionNumber: doc.currentVersion,
        title: doc.title,
        body: doc.body,
        sections: doc.metadata,
        changedBy: new Types.ObjectId(String(userId)),
        changeSummary: payload.changeSummary || `Updated to version ${doc.currentVersion + 1}`,
        savedAt: new Date(),
      });

      doc.currentVersion += 1;
      doc.title = payload.title;
      doc.body = payload.body;
      if (payload.contentType) doc.contentType = payload.contentType;
      if (payload.status) {
        doc.status = payload.status;
        if (payload.status === 'PUBLISHED') doc.publishedAt = new Date();
      }
      if (payload.seoTitle) doc.seoTitle = payload.seoTitle;
      if (payload.seoDescription) doc.seoDescription = payload.seoDescription;
      if (payload.metadata) doc.metadata = payload.metadata;
      doc.updatedBy = new Types.ObjectId(String(userId));

      await doc.save();
    }

    await AuditLogService.record({
      action: 'UPDATE',
      targetCollection: 'WebsiteContent',
      targetId: doc._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: orgId,
      diff: { contentKey: key, version: doc.currentVersion, summary: payload.changeSummary },
      module: 'MARKETING',
    });

    return doc;
  }

  /**
   * Rollback content to a specific previous version
   */
  public static async rollbackContent(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    contentId: string,
    targetVersionNumber: number
  ): Promise<IWebsiteContent> {
    const doc = await WebsiteContentModel.findOne({
      _id: new Types.ObjectId(contentId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });

    if (!doc) throw new Error('কনটেন্ট খুঁজে পাওয়া যায়নি');

    const targetVersion = doc.versions.find((v) => v.versionNumber === targetVersionNumber);
    if (!targetVersion) throw new Error(`ভার্সন ${targetVersionNumber} পাওয়া যায়নি`);

    // Archive current before rollback
    doc.versions.push({
      versionNumber: doc.currentVersion,
      title: doc.title,
      body: doc.body,
      changedBy: new Types.ObjectId(String(userId)),
      changeSummary: `Reverted to version ${targetVersionNumber}`,
      savedAt: new Date(),
    });

    doc.currentVersion += 1;
    doc.title = targetVersion.title;
    doc.body = targetVersion.body;
    doc.updatedBy = new Types.ObjectId(String(userId));
    await doc.save();

    await AuditLogService.record({
      action: 'ROLLBACK',
      targetCollection: 'WebsiteContent',
      targetId: doc._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { contentKey: doc.contentKey, revertedToVersion: targetVersionNumber },
      module: 'MARKETING',
    });

    return doc;
  }

  // ── Landing Pages ──

  public static async getLandingPages(
    organizationId: Types.ObjectId | string,
    filters: { status?: string } = {}
  ): Promise<ILandingPage[]> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };
    if (filters.status && filters.status !== 'ALL') query.status = filters.status;
    return LandingPageModel.find(query).populate('campaignId', 'name campaignCode').sort({ createdAt: -1 });
  }

  public static async getLandingPageBySlug(slug: string): Promise<ILandingPage | null> {
    return LandingPageModel.findOne({ slug: slug.toLowerCase().trim(), status: 'PUBLISHED' })
      .populate('sections.productIds', 'name sku price salePrice thumbnail')
      .populate('sections.categoryIds', 'name slug')
      .populate('sections.brandIds', 'name slug');
  }

  public static async createLandingPage(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: Partial<ILandingPage>
  ): Promise<ILandingPage> {
    const orgId = new Types.ObjectId(String(organizationId));
    const slug = (payload.slug || payload.title || 'page')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const existing = await LandingPageModel.findOne({ slug });
    if (existing) {
      throw new Error(`স্লাগ "${slug}" ইতিপূর্বে ব্যবহৃত হয়েছে। অনুগ্রহ করে অন্য স্লাগ দিন।`);
    }

    const page = new LandingPageModel({
      ...payload,
      organizationId: orgId,
      slug,
      status: payload.status || 'DRAFT',
      createdBy: new Types.ObjectId(String(userId)),
      sections: payload.sections || [],
    });

    await page.save();

    await AuditLogService.record({
      action: 'CREATE',
      targetCollection: 'LandingPage',
      targetId: page._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: orgId,
      diff: { title: page.title, slug: page.slug },
      module: 'MARKETING',
    });

    return page;
  }

  public static async updateLandingPage(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    pageId: string,
    payload: Partial<ILandingPage>
  ): Promise<ILandingPage> {
    const page = await LandingPageModel.findOne({
      _id: new Types.ObjectId(pageId),
      organizationId: new Types.ObjectId(String(organizationId)),
    });
    if (!page) throw new Error('ল্যান্ডিং পেজ খুঁজে পাওয়া যায়নি');

    Object.assign(page, payload, { updatedBy: new Types.ObjectId(String(userId)) });
    if (payload.status === 'PUBLISHED' && !page.publishedAt) {
      page.publishedAt = new Date();
    }
    await page.save();

    await AuditLogService.record({
      action: 'UPDATE',
      targetCollection: 'LandingPage',
      targetId: page._id as Types.ObjectId,
      actorId: new Types.ObjectId(String(userId)),
      organizationId: new Types.ObjectId(String(organizationId)),
      diff: { title: page.title, slug: page.slug, status: page.status },
      module: 'MARKETING',
    });

    return page;
  }

  // ── Navigation Menus ──

  public static async getNavigationMenus(
    organizationId: Types.ObjectId | string,
    position?: string
  ): Promise<INavigationMenu[]> {
    const query: any = { organizationId: new Types.ObjectId(String(organizationId)) };
    if (position) query.position = position;
    return NavigationMenuModel.find(query).sort({ position: 1 });
  }

  public static async upsertNavigationMenu(
    organizationId: Types.ObjectId | string,
    userId: Types.ObjectId | string,
    payload: Partial<INavigationMenu>
  ): Promise<INavigationMenu> {
    const orgId = new Types.ObjectId(String(organizationId));
    let menu: INavigationMenu | null = null;

    if (payload._id) {
      menu = await NavigationMenuModel.findOne({ _id: payload._id, organizationId: orgId });
    } else if (payload.menuCode) {
      menu = await NavigationMenuModel.findOne({ menuCode: payload.menuCode, organizationId: orgId });
    }

    if (menu) {
      Object.assign(menu, payload, { updatedBy: new Types.ObjectId(String(userId)) });
      await menu.save();
    } else {
      menu = new NavigationMenuModel({
        ...payload,
        organizationId: orgId,
        menuCode: payload.menuCode || `MENU_${Date.now()}`,
        createdBy: new Types.ObjectId(String(userId)),
      });
      await menu.save();
    }

    return menu;
  }
}

export default WebsiteContentService;
