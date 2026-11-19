import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { MarketingCampaignService } from '../services/MarketingCampaignService';
import { BannerSliderService } from '../services/BannerSliderService';
import { WebsiteContentService } from '../services/WebsiteContentService';
import { SocialMediaService } from '../services/SocialMediaService';
import { MarketingSchedulerService } from '../services/MarketingSchedulerService';
import { MarketingAnalyticsService } from '../services/MarketingAnalyticsService';
import { MarketingAiService } from '../services/MarketingAiService';
import logger from '../config/logger';

export class MarketingController {
  // Helper to extract organizationId
  private static getOrgId(req: Request): string {
    const orgId =
      (req.user as any)?.organizationId ||
      req.headers['x-organization-id'] ||
      '600000000000000000000001';
    return String(orgId);
  }

  private static getUserId(req: Request): string {
    const u = req.user as any;
    return String(u?.userId || u?._id || '000000000000000000000001');
  }

  // ── 1. DASHBOARD & ANALYTICS ──

  public static async getDashboardMetrics(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const metrics = await MarketingAnalyticsService.getDashboardMetrics(orgId);
      res.json({ success: true, data: metrics });
    } catch (err: any) {
      logger.error(`Error in getDashboardMetrics: ${err.message}`);
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── 2. BANNERS & SLIDERS ──

  public static async getBanners(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { bannerType, status, search, limit, skip } = req.query;
      const result = await BannerSliderService.getBanners(orgId, {
        bannerType: bannerType as string,
        status: status as string,
        search: search as string,
        limit: limit ? Number(limit) : 50,
        skip: skip ? Number(skip) : 0,
      });
      res.json({ success: true, data: result.banners, total: result.total });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createBanner(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const banner = await BannerSliderService.createBanner(orgId, userId, req.body);
      res.status(201).json({ success: true, data: banner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateBanner(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const banner = await BannerSliderService.updateBanner(orgId, userId, req.params.id as string, req.body);
      res.json({ success: true, data: banner });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async publishBanner(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const banner = await BannerSliderService.publishBanner(orgId, userId, req.params.id as string);
      res.json({ success: true, data: banner, message: 'ব্যানার সফলভাবে পাবলিশ হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async unpublishBanner(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const banner = await BannerSliderService.unpublishBanner(orgId, userId, req.params.id as string);
      res.json({ success: true, data: banner, message: 'ব্যানার ড্রাফটে রূপান্তর করা হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async reorderBanners(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      await BannerSliderService.reorderBanners(orgId, userId, req.body.items);
      res.json({ success: true, message: 'ক্রম সফলভাবে হালনাগাদ করা হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ── 3. CAMPAIGNS ──

  public static async getCampaigns(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { status, campaignType, search, limit, skip } = req.query;
      const result = await MarketingCampaignService.getCampaigns(orgId, {
        status: status as string,
        campaignType: campaignType as string,
        search: search as string,
        limit: limit ? Number(limit) : 50,
        skip: skip ? Number(skip) : 0,
      });
      res.json({ success: true, data: result.campaigns, total: result.total });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createCampaign(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const campaign = await MarketingCampaignService.createCampaign(orgId, userId, req.body);
      res.status(201).json({ success: true, data: campaign });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateCampaign(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const campaign = await MarketingCampaignService.updateCampaign(orgId, userId, req.params.id as string, req.body);
      res.json({ success: true, data: campaign });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async submitCampaign(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const campaign = await MarketingCampaignService.submitCampaignForApproval(orgId, userId, req.params.id as string);
      res.json({ success: true, data: campaign, message: 'ক্যাম্পেইনটি অনুমোদনের জন্য জমা দেওয়া হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async processCampaignApproval(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const { decision, rejectionReason } = req.body;
      const campaign = await MarketingCampaignService.processCampaignApproval(
        orgId,
        userId,
        req.params.id as string,
        decision,
        rejectionReason
      );
      res.json({ success: true, data: campaign, message: `ক্যাম্পেইন ${decision === 'APPROVE' ? 'অনুমোদিত' : 'প্রত্যাখ্যাত'} হয়েছে` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateCampaignStatus(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const { status } = req.body;
      const campaign = await MarketingCampaignService.updateCampaignStatus(orgId, userId, req.params.id as string, status);
      res.json({ success: true, data: campaign, message: `ক্যাম্পেইন স্ট্যাটাস ${status} এ পরিবর্তিত হয়েছে` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ── 4. PROMOTIONS ──

  public static async getPromotions(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { targetType, status, campaignId } = req.query;
      const promotions = await MarketingCampaignService.getPromotions(orgId, {
        targetType: targetType as string,
        status: status as string,
        campaignId: campaignId as string,
      });
      res.json({ success: true, data: promotions });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createPromotion(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const promo = await MarketingCampaignService.createPromotion(orgId, userId, req.body);
      res.status(201).json({ success: true, data: promo });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ── 5. CMS CONTENT & LANDING PAGES ──

  public static async getAllContent(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { contentType, language } = req.query;
      const items = await WebsiteContentService.getAllContent(orgId, {
        contentType: contentType as string,
        language: language as string,
      });
      res.json({ success: true, data: items });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async upsertContent(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const doc = await WebsiteContentService.upsertContent(orgId, userId, req.body);
      res.json({ success: true, data: doc, message: 'কনটেন্ট সফলভাবে সংরক্ষিত হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async rollbackContent(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const { versionNumber } = req.body;
      const doc = await WebsiteContentService.rollbackContent(orgId, userId, req.params.id as string, Number(versionNumber));
      res.json({ success: true, data: doc, message: `ভার্সন ${versionNumber} এ সফলভাবে ফিরিয়ে নেওয়া হয়েছে` });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getLandingPages(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { status } = req.query;
      const pages = await WebsiteContentService.getLandingPages(orgId, { status: status as string });
      res.json({ success: true, data: pages });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createLandingPage(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const page = await WebsiteContentService.createLandingPage(orgId, userId, req.body);
      res.status(201).json({ success: true, data: page });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateLandingPage(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const page = await WebsiteContentService.updateLandingPage(orgId, userId, req.params.id as string, req.body);
      res.json({ success: true, data: page });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ── 6. NAVIGATION MENUS ──

  public static async getNavigationMenus(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { position } = req.query;
      const menus = await WebsiteContentService.getNavigationMenus(orgId, position as string);
      res.json({ success: true, data: menus });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async upsertNavigationMenu(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const menu = await WebsiteContentService.upsertNavigationMenu(orgId, userId, req.body);
      res.json({ success: true, data: menu });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  // ── 7. SOCIAL MEDIA ──

  public static async getSocialAccounts(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const accounts = await SocialMediaService.getSocialAccounts(orgId);
      res.json({ success: true, data: accounts });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async connectSocialAccount(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const account = await SocialMediaService.connectSocialAccount(orgId, userId, req.body);
      res.json({ success: true, data: account, message: 'সোশ্যাল অ্যাকাউন্ট সফলভাবে যুক্ত হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async disconnectSocialAccount(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const account = await SocialMediaService.disconnectSocialAccount(orgId, userId, req.params.id as string);
      res.json({ success: true, data: account, message: 'সোশ্যাল অ্যাকাউন্ট ডিসকানেক্ট করা হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getSocialPosts(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { publishStatus, platform, campaignId, limit, skip } = req.query;
      const result = await SocialMediaService.getSocialPosts(orgId, {
        publishStatus: publishStatus as string,
        platform: platform as string,
        campaignId: campaignId as string,
        limit: limit ? Number(limit) : 50,
        skip: skip ? Number(skip) : 0,
      });
      res.json({ success: true, data: result.posts, total: result.total });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createSocialPost(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const post = await SocialMediaService.createSocialPost(orgId, userId, req.body);
      res.status(201).json({ success: true, data: post });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async updateSocialPost(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const post = await SocialMediaService.updateSocialPost(orgId, userId, req.params.id as string, req.body);
      res.json({ success: true, data: post });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async publishSocialPost(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const userId = MarketingController.getUserId(req);
      const post = await SocialMediaService.publishSocialPost(orgId, userId, req.params.id as string);
      res.json({ success: true, data: post, message: 'পোস্ট সফলভাবে পাবলিশ হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getMarketingCalendar(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const { year, month } = req.query;
      const calendar = await SocialMediaService.getMarketingCalendar(orgId, {
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
      });
      res.json({ success: true, data: calendar });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── 8. SCHEDULER & AI CO-PILOT ──

  public static async runScheduler(req: Request, res: Response) {
    try {
      const report = await MarketingSchedulerService.executeSchedulerReconciliation();
      res.json({ success: true, data: report, message: 'শিডিউলার রিকনসিলিয়েশন সফলভাবে সম্পন্ন হয়েছে' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async generateAiSuggestions(req: Request, res: Response) {
    try {
      const result = await MarketingAiService.generateMarketingSuggestions(req.body);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ── 9. SETTINGS & AUDIT LOGS ──

  public static async getSettings(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const settings = await MarketingAnalyticsService.getSettings(orgId);
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateSettings(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const settings = await MarketingAnalyticsService.updateSettings(orgId, req.body);
      res.json({ success: true, data: settings, message: 'মার্কেটিং সেটিংস সফলভাবে হালনাগাদ করা হয়েছে' });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  }

  public static async getAuditLogs(req: Request, res: Response) {
    try {
      const orgId = MarketingController.getOrgId(req);
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const logs = await MarketingAnalyticsService.getMarketingAuditLogs(orgId, limit);
      res.json({ success: true, data: logs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

export default MarketingController;
