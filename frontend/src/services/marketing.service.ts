import { apiClient } from '../lib/api';

export interface WebsiteBannerData {
  _id: string;
  bannerCode: string;
  name: string;
  bannerType: string;
  title: string;
  subtitle?: string;
  description?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  desktopImageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  targetUrl?: string;
  displayPosition?: string;
  displayOrder: number;
  startDate: string;
  endDate: string;
  backgroundColor?: string;
  textColor?: string;
  overlayOpacity?: number;
  textPosition?: 'LEFT' | 'CENTER' | 'RIGHT';
  buttonStyle?: 'PRIMARY' | 'SECONDARY' | 'OUTLINE' | 'GOLD';
  sliderSettings?: {
    isSlide: boolean;
    autoplaySpeed?: number;
    transitionEffect?: 'fade' | 'slide';
  };
  popupSettings?: {
    frequency?: 'ONCE_PER_SESSION' | 'ONCE_PER_USER' | 'ALWAYS';
    delaySeconds?: number;
    deviceVisibility?: 'ALL' | 'DESKTOP_ONLY' | 'MOBILE_ONLY';
  };
  announcementSettings?: {
    highlightText?: string;
    badgeText?: string;
  };
  approvalStatus: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
  isActive: boolean;
  clickCount?: number;
  impressionCount?: number;
  createdAt?: string;
}

export interface MarketingCampaignData {
  _id: string;
  campaignCode: string;
  name: string;
  campaignType: string;
  description?: string;
  bannerImageUrl?: string;
  startDate: string;
  endDate: string;
  targetAudience?: string;
  budget: number;
  spentAmount?: number;
  revenueGenerated?: number;
  discountPercentage?: number;
  discountAmount?: number;
  couponCode?: string;
  status: string;
  approvalStatus: string;
  metrics?: {
    impressions: number;
    clicks: number;
    conversions: number;
    ordersCount: number;
    averageOrderValue: number;
  };
  applicableProductIds?: any[];
  applicableCategoryIds?: any[];
  applicableBrandIds?: any[];
  createdAt?: string;
}

export interface MarketingPromotionData {
  _id: string;
  promotionCode: string;
  name: string;
  targetType: 'PRODUCT' | 'CATEGORY' | 'BRAND';
  productId?: any;
  categoryId?: any;
  brandId?: any;
  campaignId?: any;
  discountType: string;
  discountValue: number;
  originalPrice?: number;
  promotionalPrice?: number;
  startDate: string;
  endDate: string;
  status: string;
}

export interface WebsiteContentData {
  _id: string;
  contentKey: string;
  title: string;
  contentType: string;
  body: string;
  language: 'bn' | 'en';
  currentVersion: number;
  versions?: any[];
  status: string;
  publishedAt?: string;
  effectiveDate?: string;
  seoTitle?: string;
  seoDescription?: string;
  metadata?: any;
}

export interface LandingPageData {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  featuredImageUrl?: string;
  status: string;
  sections: any[];
  viewCount?: number;
  conversionCount?: number;
  publishedAt?: string;
}

export interface SocialAccountData {
  _id: string;
  platform: string;
  accountName: string;
  accountHandle?: string;
  isConnected: boolean;
  status: string;
  lastSyncedAt?: string;
  metrics?: {
    followersCount: number;
    postsCount: number;
    engagementRate: number;
  };
}

export interface SocialPostData {
  _id: string;
  postCode: string;
  title: string;
  contentType: string;
  primaryCaption: string;
  hashtags?: string[];
  mediaUrls?: string[];
  platformVariants: any[];
  scheduledDate: string;
  approvalStatus: string;
  publishStatus: string;
  metrics?: any;
}

export const marketingService = {
  // ── 1. Dashboard & Calendar & Scheduler ──
  async getDashboardMetrics(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/marketing/dashboard');
    return res.data;
  },

  async getMarketingCalendar(params: Record<string, any> = {}): Promise<any[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/marketing/calendar?${q}`);
    return res.data || [];
  },

  async runScheduler(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any; message: string }>('/erp/marketing/scheduler/run', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    return res;
  },

  async generateAiSuggestions(payload: {
    task: string;
    productName?: string;
    tone?: string;
    language?: string;
  }): Promise<{ suggestions: string[]; generatedBy: string }> {
    const res = await apiClient<{ success: boolean; data: { suggestions: string[]; generatedBy: string } }>(
      '/erp/marketing/ai/suggest',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  // ── 2. Banners & Sliders ──
  async getBanners(params: Record<string, any> = {}): Promise<{ banners: WebsiteBannerData[]; total: number }> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: WebsiteBannerData[]; total: number }>(
      `/erp/marketing/banners?${q}`
    );
    return { banners: res.data || [], total: res.total || 0 };
  },

  async createBanner(payload: any): Promise<WebsiteBannerData> {
    const res = await apiClient<{ success: boolean; data: WebsiteBannerData }>('/erp/marketing/banners', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateBanner(id: string, payload: any): Promise<WebsiteBannerData> {
    const res = await apiClient<{ success: boolean; data: WebsiteBannerData }>(`/erp/marketing/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async publishBanner(id: string): Promise<WebsiteBannerData> {
    const res = await apiClient<{ success: boolean; data: WebsiteBannerData }>(
      `/erp/marketing/banners/${id}/publish`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async unpublishBanner(id: string): Promise<WebsiteBannerData> {
    const res = await apiClient<{ success: boolean; data: WebsiteBannerData }>(
      `/erp/marketing/banners/${id}/unpublish`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async reorderBanners(items: Array<{ id: string; displayOrder: number }>): Promise<any> {
    const res = await apiClient<{ success: boolean; message: string }>('/erp/marketing/banners/reorder', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
    return res;
  },

  // ── 3. Campaigns ──
  async getCampaigns(params: Record<string, any> = {}): Promise<{ campaigns: MarketingCampaignData[]; total: number }> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: MarketingCampaignData[]; total: number }>(
      `/erp/marketing/campaigns?${q}`
    );
    return { campaigns: res.data || [], total: res.total || 0 };
  },

  async createCampaign(payload: any): Promise<MarketingCampaignData> {
    const res = await apiClient<{ success: boolean; data: MarketingCampaignData }>('/erp/marketing/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateCampaign(id: string, payload: any): Promise<MarketingCampaignData> {
    const res = await apiClient<{ success: boolean; data: MarketingCampaignData }>(`/erp/marketing/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async submitCampaign(id: string): Promise<MarketingCampaignData> {
    const res = await apiClient<{ success: boolean; data: MarketingCampaignData }>(
      `/erp/marketing/campaigns/${id}/submit`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async approveCampaign(id: string, decision: 'APPROVE' | 'REJECT', rejectionReason?: string): Promise<MarketingCampaignData> {
    const res = await apiClient<{ success: boolean; data: MarketingCampaignData }>(
      `/erp/marketing/campaigns/${id}/approve`,
      { method: 'POST', body: JSON.stringify({ decision, rejectionReason }) }
    );
    return res.data;
  },

  async updateCampaignStatus(id: string, status: string): Promise<MarketingCampaignData> {
    const res = await apiClient<{ success: boolean; data: MarketingCampaignData }>(
      `/erp/marketing/campaigns/${id}/status`,
      { method: 'PUT', body: JSON.stringify({ status }) }
    );
    return res.data;
  },

  // ── 4. Promotions ──
  async getPromotions(params: Record<string, any> = {}): Promise<MarketingPromotionData[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: MarketingPromotionData[] }>(
      `/erp/marketing/promotions?${q}`
    );
    return res.data || [];
  },

  async createPromotion(payload: any): Promise<MarketingPromotionData> {
    const res = await apiClient<{ success: boolean; data: MarketingPromotionData }>('/erp/marketing/promotions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ── 5. CMS Content & Landing Pages ──
  async getAllContent(params: Record<string, any> = {}): Promise<WebsiteContentData[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: WebsiteContentData[] }>(`/erp/marketing/content?${q}`);
    return res.data || [];
  },

  async upsertContent(payload: any): Promise<WebsiteContentData> {
    const res = await apiClient<{ success: boolean; data: WebsiteContentData }>('/erp/marketing/content', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async rollbackContent(id: string, versionNumber: number): Promise<WebsiteContentData> {
    const res = await apiClient<{ success: boolean; data: WebsiteContentData }>(
      `/erp/marketing/content/${id}/rollback`,
      { method: 'POST', body: JSON.stringify({ versionNumber }) }
    );
    return res.data;
  },

  async getLandingPages(params: Record<string, any> = {}): Promise<LandingPageData[]> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: LandingPageData[] }>(`/erp/marketing/pages?${q}`);
    return res.data || [];
  },

  async createLandingPage(payload: any): Promise<LandingPageData> {
    const res = await apiClient<{ success: boolean; data: LandingPageData }>('/erp/marketing/pages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateLandingPage(id: string, payload: any): Promise<LandingPageData> {
    const res = await apiClient<{ success: boolean; data: LandingPageData }>(`/erp/marketing/pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ── 6. Navigation Menus ──
  async getNavigationMenus(position?: string): Promise<any[]> {
    const q = position ? `?position=${position}` : '';
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/marketing/navigation${q}`);
    return res.data || [];
  },

  async upsertNavigationMenu(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/marketing/navigation', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // ── 7. Social Media ──
  async getSocialAccounts(): Promise<SocialAccountData[]> {
    const res = await apiClient<{ success: boolean; data: SocialAccountData[] }>('/erp/marketing/social/accounts');
    return res.data || [];
  },

  async connectSocialAccount(payload: any): Promise<SocialAccountData> {
    const res = await apiClient<{ success: boolean; data: SocialAccountData }>(
      '/erp/marketing/social/accounts/connect',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  async disconnectSocialAccount(id: string): Promise<SocialAccountData> {
    const res = await apiClient<{ success: boolean; data: SocialAccountData }>(
      `/erp/marketing/social/accounts/${id}/disconnect`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  async getSocialPosts(params: Record<string, any> = {}): Promise<{ posts: SocialPostData[]; total: number }> {
    const q = new URLSearchParams(params).toString();
    const res = await apiClient<{ success: boolean; data: SocialPostData[]; total: number }>(
      `/erp/marketing/social/posts?${q}`
    );
    return { posts: res.data || [], total: res.total || 0 };
  },

  async createSocialPost(payload: any): Promise<SocialPostData> {
    const res = await apiClient<{ success: boolean; data: SocialPostData }>('/erp/marketing/social/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async updateSocialPost(id: string, payload: any): Promise<SocialPostData> {
    const res = await apiClient<{ success: boolean; data: SocialPostData }>(`/erp/marketing/social/posts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async publishSocialPost(id: string): Promise<SocialPostData> {
    const res = await apiClient<{ success: boolean; data: SocialPostData }>(
      `/erp/marketing/social/posts/${id}/publish`,
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  // ── 8. Settings & Audit Logs ──
  async getSettings(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/marketing/settings');
    return res.data;
  },

  async updateSettings(payload: any): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/erp/marketing/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  async getAuditLogs(limit = 50): Promise<any[]> {
    const res = await apiClient<{ success: boolean; data: any[] }>(`/erp/marketing/audit-logs?limit=${limit}`);
    return res.data || [];
  },

  // ── 9. Public Endpoints ──
  async getPublicBanners(type?: string): Promise<any[]> {
    const q = type ? `?type=${type}` : '';
    const res = await apiClient<{ success: boolean; data: any[] }>(`/public/marketing/banners${q}`);
    return res.data || [];
  },

  async getPublicAnnouncements(): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>('/public/marketing/announcements');
    return res.data;
  },
};

export default marketingService;
