import { apiClient, submitDisputeClaim } from '../lib/api';

export interface RmaClaimPayload {
  orderId: string;
  productSku: string;
  productName: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  claimType: string;
  description: string;
}

export const rmaService = {
  async submitClaim(payload: RmaClaimPayload): Promise<{ success: boolean; data?: any; error?: string }> {
    return await submitDisputeClaim(payload);
  },

  async getClaimStatus(ticketId: string): Promise<any | null> {
    try {
      const res = await apiClient<{ success: boolean; data: any }>(`/rma/${encodeURIComponent(ticketId)}`);
      return res?.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  },
};

export default rmaService;
