import { apiClient, createCheckout } from '../lib/api';
import { OrderConfirmation, CheckoutPayload } from '../types';

export const orderService = {
  async create(payload: CheckoutPayload): Promise<{ success: boolean; data?: OrderConfirmation; error?: string }> {
    return await createCheckout(payload);
  },

  async getById(orderId: string): Promise<OrderConfirmation | null> {
    try {
      const res = await apiClient<{ success: boolean; data: OrderConfirmation }>(`/orders/${encodeURIComponent(orderId)}`);
      return res?.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  },

  async getUserOrders(phone: string): Promise<OrderConfirmation[]> {
    try {
      const res = await apiClient<{ success: boolean; data: OrderConfirmation[] }>(`/orders/user?phone=${encodeURIComponent(phone)}`);
      return res?.success && res.data ? res.data : [];
    } catch {
      return [];
    }
  },
};

export default orderService;
