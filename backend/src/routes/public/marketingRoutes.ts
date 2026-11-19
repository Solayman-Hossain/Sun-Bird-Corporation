import { Router, Request, Response } from 'express';
import { BannerSliderService } from '../../services/BannerSliderService';
import { WebsiteContentService } from '../../services/WebsiteContentService';
import { BannerType } from '../../models/WebsiteBanner';

export const publicMarketingRoutes = Router();

/**
 * @desc Get active published banners / sliders for public site
 */
publicMarketingRoutes.get('/banners', async (req: Request, res: Response) => {
  try {
    const { type, organizationId } = req.query;
    const banners = await BannerSliderService.getPublicActiveBanners(
      organizationId as string,
      type as BannerType
    );
    res.json({ success: true, data: banners });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @desc Get active announcement bar
 */
publicMarketingRoutes.get('/announcements', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    const announcements = await BannerSliderService.getPublicActiveBanners(
      organizationId as string,
      'ANNOUNCEMENT_BAR'
    );
    res.json({ success: true, data: announcements[0] || null });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @desc Get active popups
 */
publicMarketingRoutes.get('/popups', async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.query;
    const popups = await BannerSliderService.getPublicActiveBanners(
      organizationId as string,
      'POPUP_WELCOME'
    );
    res.json({ success: true, data: popups });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @desc Get published CMS page / policy by key
 */
publicMarketingRoutes.get('/content/:key', async (req: Request, res: Response) => {
  try {
    const key = req.params.key as string;
    const organizationId = (req.query.organizationId as string) || '600000000000000000000001';
    const lang = (req.query.lang as string) || 'bn';
    const content = await WebsiteContentService.getContentByKey(organizationId, key, lang);
    if (!content || content.status !== 'PUBLISHED') {
      return res.status(404).json({ success: false, message: 'Content not found or not published' });
    }
    res.json({
      success: true,
      data: {
        key: content.contentKey,
        title: content.title,
        body: content.body,
        seoTitle: content.seoTitle,
        seoDescription: content.seoDescription,
        effectiveDate: content.effectiveDate,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @desc Get published landing page by slug
 */
publicMarketingRoutes.get('/landing-pages/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug as string;
    const page = await WebsiteContentService.getLandingPageBySlug(slug);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Landing page not found' });
    }
    res.json({ success: true, data: page });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @desc Track banner click beacon
 */
publicMarketingRoutes.post('/banners/:id/click', async (req: Request, res: Response) => {
  try {
    const bannerId = req.params.id as string;
    await BannerSliderService.trackBannerClick(bannerId);
    res.json({ success: true });
  } catch {
    res.json({ success: true }); // Silent fail for beacons
  }
});

export default publicMarketingRoutes;
