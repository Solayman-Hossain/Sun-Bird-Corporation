import { apiClient } from '../lib/api';

export interface UserProfileData {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  organization?: string;
  address?: string;
  district?: string;
}

export const userService = {
  async getProfile(): Promise<UserProfileData | null> {
    try {
      const res = await apiClient<{ success: boolean; data: { user: UserProfileData } }>('/auth/me');
      return res?.success && res.data?.user ? res.data.user : null;
    } catch {
      return null;
    }
  },

  async updateProfile(data: Partial<UserProfileData>): Promise<UserProfileData | null> {
    try {
      const res = await apiClient<{ success: boolean; data: UserProfileData }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return res?.success && res.data ? res.data : null;
    } catch {
      return null;
    }
  },
};

export default userService;

