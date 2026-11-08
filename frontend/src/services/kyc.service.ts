import { apiClient } from '../api/client';

export interface KycSubmissionPayload {
  institutionName: string;
  institutionType: 'hospital' | 'clinic' | 'diagnostic_center' | 'pharmacy' | 'individual_practitioner';
  dgdaDrugLicenseNo?: string;
  bmdcRegNo?: string;
  tradeLicenseNo: string;
  binMushakNumber?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  facilityAddress: string;
  documentUrls: string[];
}

export interface KycVerificationStatus {
  id: string;
  institutionName: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  verificationBadge: boolean;
  reviewedAt?: string;
  rejectionReason?: string;
  submittedAt: string;
}

export const kycService = {
  async submitKyc(payload: KycSubmissionPayload): Promise<{ success: boolean; trackingNumber: string }> {
    return apiClient.post<{ success: boolean; trackingNumber: string }>('/kyc/submit', payload);
  },

  async getKycStatus(phoneOrId: string): Promise<KycVerificationStatus> {
    return apiClient.get<KycVerificationStatus>(`/kyc/status/${phoneOrId}`);
  },

  async verifyDgdaLicense(licenseNumber: string): Promise<{ valid: boolean; companyName?: string; expiryDate?: string }> {
    return apiClient.post<{ valid: boolean; companyName?: string; expiryDate?: string }>('/kyc/verify-dgda', { licenseNumber });
  }
};

