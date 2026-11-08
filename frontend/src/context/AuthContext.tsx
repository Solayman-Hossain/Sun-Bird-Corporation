'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from './ToastContext';
import { apiClient } from '../lib/api';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'customer' | 'hospital_procurement' | 'admin' | string;
  token?: string;
  organization?: string;
  address?: string;
  district?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPhone: (phone: string) => Promise<{ otpSent: boolean; message?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  loginAsDemoUser: (role?: 'customer' | 'hospital_procurement' | 'admin') => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Hydrate user and verify session token with backend /api/v1/auth/me
  useEffect(() => {
    async function syncSession() {
      try {
        const savedUser = localStorage.getItem('sunbird_user');
        const token = localStorage.getItem('sunbird_token');

        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);

          // Attempt backend verification
          try {
            const meRes = await apiClient<{ success: boolean; data: any }>('/auth/me');
            if (meRes?.success && meRes?.data?.user) {
              const liveUser: UserProfile = {
                id: meRes.data.user.id || meRes.data.user._id,
                name: meRes.data.user.name,
                phone: meRes.data.user.phone,
                email: meRes.data.user.email,
                role: meRes.data.user.role || 'customer',
                organization: meRes.data.user.organization,
                address: meRes.data.user.address,
                district: meRes.data.user.district,
                token: token || undefined,
              };
              setUser(liveUser);
              localStorage.setItem('sunbird_user', JSON.stringify(liveUser));
            }
          } catch {
            // keep offline cached session if backend is temporarily unreachable
          }
        }
      } catch {
        // storage access fallback
      } finally {
        setIsLoading(false);
      }
    }

    syncSession();
  }, []);

  const loginWithPhone = async (phone: string): Promise<{ otpSent: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      // Connects to backend /api/v1/auth/request-otp
      await apiClient.post('/auth/request-otp', { phone });
      showToast(`Verification OTP sent to ${phone}`, 'info');
      return { otpSent: true };
    } catch {
      // Graceful offline demo support
      await new Promise((resolve) => setTimeout(resolve, 500));
      showToast(`Verification OTP sent to ${phone} (Demo Code: 1234)`, 'info');
      return { otpSent: true };
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (phone: string, otp: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Attempt backend OTP verification
      const res = await apiClient.post<{
        success: boolean;
        token?: string;
        data?: { user: any; token: string };
      }>('/auth/verify-otp', { phone, otp });

      if (res?.success) {
        const token = res.token || res.data?.token || `jwt_${Date.now()}`;
        const userData = res.data?.user || {
          id: `usr_${Date.now()}`,
          name: 'ড. মো: রফিকুল ইসলাম',
          phone,
          email: 'dr.rafiqul@centraldiag.com',
          role: 'hospital_procurement',
          organization: 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স',
          address: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা',
          district: 'Dhaka',
        };

        const activeUser: UserProfile = { ...userData, token };
        setUser(activeUser);
        localStorage.setItem('sunbird_user', JSON.stringify(activeUser));
        localStorage.setItem('sunbird_token', token);
        showToast('Login successful! Welcome to Sun Bird Corporation', 'success');
        return true;
      }
      showToast('Invalid verification code. Please check and retry.', 'error');
      return false;
    } catch {
      // Offline fallback: accept 1234 or any 4/6 digit code
      if (otp === '1234' || otp.length === 4 || otp.length === 6) {
        const token = `jwt_offline_${Date.now()}`;
        const activeUser: UserProfile = {
          id: `usr_${Date.now()}`,
          name: 'ড. মো: রফিকুল ইসলাম',
          phone,
          email: 'dr.rafiqul@centraldiag.com',
          role: 'hospital_procurement',
          organization: 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স',
          address: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা',
          district: 'Dhaka',
          token,
        };
        setUser(activeUser);
        localStorage.setItem('sunbird_user', JSON.stringify(activeUser));
        localStorage.setItem('sunbird_token', token);
        showToast('Login successful! Welcome to Sun Bird Corporation', 'success');
        return true;
      }
      showToast('Invalid verification code entered.', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('sunbird_user');
      localStorage.removeItem('sunbird_token');
    } catch {
      // ignore
    }
    showToast('You have been logged out safely', 'info');
  };

  const loginAsDemoUser = (role: 'customer' | 'hospital_procurement' | 'admin' = 'customer') => {
    const demoUser: UserProfile = {
      id: `demo-${role}-1`,
      name:
        role === 'admin'
          ? 'Operations Manager (Tejgaon Central)'
          : role === 'hospital_procurement'
          ? 'ড. মো: রফিকুল ইসলাম (Central Diagnostic)'
          : 'কাজী মাহমুদুল হাসান',
      phone: '01711-000000',
      email:
        role === 'admin'
          ? 'admin@sunbirdcorp.com'
          : 'procurement@centraldiag.com',
      role,
      token: `demo_token_${Date.now()}`,
      organization: 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স',
      address: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা',
      district: 'Dhaka',
    };

    setUser(demoUser);
    try {
      localStorage.setItem('sunbird_user', JSON.stringify(demoUser));
      localStorage.setItem('sunbird_token', demoUser.token!);
    } catch {
      // ignore
    }
    showToast(`Logged in as ${demoUser.name}`, 'success');
  };

  const updateProfile = (profile: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...profile };
      try {
        localStorage.setItem('sunbird_user', JSON.stringify(updated));
      } catch {
        // ignore
      }
      showToast('Profile updated successfully', 'success');
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        loginWithPhone,
        verifyOtp,
        logout,
        loginAsDemoUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
