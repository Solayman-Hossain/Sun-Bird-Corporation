import { Router } from 'express';
import { MarketingController } from '../../controllers/MarketingController';
import { authGuard } from '../../middlewares/authGuard';
import { hasPermission } from '../../middlewares/rbacGuard';

export const marketingRoutes = Router();

// Apply authGuard to all ERP marketing routes
marketingRoutes.use(authGuard);

// ── 1. Dashboard & Calendar & Scheduler ──
marketingRoutes.get('/dashboard', hasPermission('marketing', 'VIEW'), MarketingController.getDashboardMetrics);
marketingRoutes.get('/calendar', hasPermission('marketing', 'VIEW'), MarketingController.getMarketingCalendar);
marketingRoutes.post('/scheduler/run', hasPermission('marketing', 'UPDATE'), MarketingController.runScheduler);
marketingRoutes.post('/ai/suggest', hasPermission('marketing', 'VIEW'), MarketingController.generateAiSuggestions);

// ── 2. Banners & Sliders ──
marketingRoutes.get('/banners', hasPermission('marketing', 'VIEW'), MarketingController.getBanners);
marketingRoutes.post('/banners', hasPermission('marketing', 'CREATE'), MarketingController.createBanner);
marketingRoutes.put('/banners/reorder', hasPermission('marketing', 'UPDATE'), MarketingController.reorderBanners);
marketingRoutes.put('/banners/:id', hasPermission('marketing', 'UPDATE'), MarketingController.updateBanner);
marketingRoutes.post('/banners/:id/publish', hasPermission('marketing', 'PUBLISH'), MarketingController.publishBanner);
marketingRoutes.post('/banners/:id/unpublish', hasPermission('marketing', 'UPDATE'), MarketingController.unpublishBanner);

// ── 3. Campaigns ──
marketingRoutes.get('/campaigns', hasPermission('marketing', 'VIEW'), MarketingController.getCampaigns);
marketingRoutes.post('/campaigns', hasPermission('marketing', 'CREATE'), MarketingController.createCampaign);
marketingRoutes.put('/campaigns/:id', hasPermission('marketing', 'UPDATE'), MarketingController.updateCampaign);
marketingRoutes.post('/campaigns/:id/submit', hasPermission('marketing', 'UPDATE'), MarketingController.submitCampaign);
marketingRoutes.post('/campaigns/:id/approve', hasPermission('marketing', 'APPROVE'), MarketingController.processCampaignApproval);
marketingRoutes.put('/campaigns/:id/status', hasPermission('marketing', 'UPDATE'), MarketingController.updateCampaignStatus);

// ── 4. Promotions (Product, Category, Brand) ──
marketingRoutes.get('/promotions', hasPermission('marketing', 'VIEW'), MarketingController.getPromotions);
marketingRoutes.post('/promotions', hasPermission('marketing', 'CREATE'), MarketingController.createPromotion);

// ── 5. CMS Content & Landing Pages ──
marketingRoutes.get('/content', hasPermission('marketing', 'VIEW'), MarketingController.getAllContent);
marketingRoutes.post('/content', hasPermission('marketing', 'UPDATE'), MarketingController.upsertContent);
marketingRoutes.post('/content/:id/rollback', hasPermission('marketing', 'UPDATE'), MarketingController.rollbackContent);
marketingRoutes.get('/pages', hasPermission('marketing', 'VIEW'), MarketingController.getLandingPages);
marketingRoutes.post('/pages', hasPermission('marketing', 'CREATE'), MarketingController.createLandingPage);
marketingRoutes.put('/pages/:id', hasPermission('marketing', 'UPDATE'), MarketingController.updateLandingPage);

// ── 6. Navigation Menus ──
marketingRoutes.get('/navigation', hasPermission('marketing', 'VIEW'), MarketingController.getNavigationMenus);
marketingRoutes.post('/navigation', hasPermission('marketing', 'UPDATE'), MarketingController.upsertNavigationMenu);

// ── 7. Social Media ──
marketingRoutes.get('/social/accounts', hasPermission('marketing', 'VIEW'), MarketingController.getSocialAccounts);
marketingRoutes.post('/social/accounts/connect', hasPermission('marketing', 'MANAGE_SOCIAL'), MarketingController.connectSocialAccount);
marketingRoutes.post('/social/accounts/:id/disconnect', hasPermission('marketing', 'MANAGE_SOCIAL'), MarketingController.disconnectSocialAccount);
marketingRoutes.get('/social/posts', hasPermission('marketing', 'VIEW'), MarketingController.getSocialPosts);
marketingRoutes.post('/social/posts', hasPermission('marketing', 'CREATE'), MarketingController.createSocialPost);
marketingRoutes.put('/social/posts/:id', hasPermission('marketing', 'UPDATE'), MarketingController.updateSocialPost);
marketingRoutes.post('/social/posts/:id/publish', hasPermission('marketing', 'PUBLISH'), MarketingController.publishSocialPost);

// ── 8. Settings & Audit Logs ──
marketingRoutes.get('/settings', hasPermission('marketing', 'VIEW'), MarketingController.getSettings);
marketingRoutes.put('/settings', hasPermission('marketing', 'MANAGE_SETTINGS'), MarketingController.updateSettings);
marketingRoutes.get('/audit-logs', hasPermission('marketing', 'VIEW'), MarketingController.getAuditLogs);

export default marketingRoutes;
