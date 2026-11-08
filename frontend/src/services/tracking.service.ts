import { apiClient } from '../lib/api';

export interface TrackingDetails {
  trackingId: string;
  orderNumber: string;
  courier: string;
  status: string;
  currentStep: number;
  riderName?: string;
  riderPhone?: string;
  estimatedDelivery?: string;
  events?: { status: string; timestamp: string; location: string }[];
}

export const trackingService = {
  async track(trackingQuery: string): Promise<TrackingDetails | null> {
    try {
      const res = await apiClient<{ success: boolean; data: TrackingDetails }>(`/tracking/${encodeURIComponent(trackingQuery)}`);
      return res?.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  },
};

export default trackingService;

