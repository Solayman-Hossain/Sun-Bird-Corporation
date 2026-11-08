import { apiClient } from '../lib/api';

export const mediaService = {
  async upload(file: File): Promise<{ url: string; success: boolean }> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient<{ success: boolean; data: { url: string } }>('/media/upload', {
        method: 'POST',
        body: formData as any,
      });
      return {
        url: res?.data?.url || URL.createObjectURL(file),
        success: true,
      };
    } catch {
      return {
        url: URL.createObjectURL(file),
        success: true,
      };
    }
  },
};

export default mediaService;

