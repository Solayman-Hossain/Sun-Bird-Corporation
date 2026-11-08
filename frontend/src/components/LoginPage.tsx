'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import './LoginPage.css';
import {
  HeartPulse,
  Phone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Building2,
  User,
  Sparkles,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OtpManager } from './OtpManager';

interface LoginPageProps {
  redirectUrl?: string;
  onSuccess?: () => void;
}

export function LoginPage({ redirectUrl = '/account', onSuccess }: LoginPageProps) {
  const router = useRouter();
  const { loginWithPhone, verifyOtp, loginAsDemoUser, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  // If already logged in, redirect
  if (isAuthenticated && user) {
    return (
      <div className="login-page-card text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">আপনি ইতোমধ্যে লগইন আছেন</h2>
        <p className="text-xs text-slate-600">স্বাগতম, {user.name} ({user.organization || user.role})</p>
        <div className="pt-2">
          <Link
            href={redirectUrl}
            className="login-submit-btn"
          >
            <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    const cleanPhone = phoneNumber.trim().replace(/\D/g, '');

    if (!cleanPhone || cleanPhone.length < 10) {
      setValidationError('অনুগ্রহ করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)');
      return;
    }

    const formatted = cleanPhone.startsWith('880')
      ? cleanPhone.slice(2)
      : cleanPhone.startsWith('0')
      ? cleanPhone
      : `0${cleanPhone}`;

    setIsLoading(true);
    try {
      const res = await loginWithPhone(formatted);
      if (res.otpSent) {
        setPhoneNumber(formatted);
        setStep('otp');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const success = await verifyOtp(phoneNumber, code);
      if (success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(redirectUrl);
        }
        return true;
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    await loginWithPhone(phoneNumber);
  };

  return (
    <div className="login-page-card space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#1e3932] to-[#2d5248] text-[#e6b980] flex items-center justify-center mx-auto shadow-md shadow-[#1e3932]/20">
          <HeartPulse className="w-7 h-7 animate-pulse" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 font-serif">
          সান বার্ড কর্পোরেশন
        </h1>
        <p className="text-xs text-slate-500">
          হাসপাতাল ইকুইপমেন্ট, ডায়াগনস্টিক ও এনবিআর মূসক পোর্টাল
        </p>
      </div>

      {step === 'phone' ? (
        /* Step 1: Mobile Phone Input Form */
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              মোবাইল নম্বর লিখুন
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 flex items-center gap-1 border-r border-slate-200 pr-2">
                <Phone className="w-3.5 h-3.5 text-[#1e3932]" />
                <span>+৮৮</span>
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setValidationError('');
                }}
                placeholder="01711-000000"
                maxLength={11}
                className="login-phone-input"
                autoFocus
              />
            </div>
            {validationError && (
              <p className="text-[11px] text-rose-600 font-semibold pt-1">
                {validationError}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="login-submit-btn"
          >
            <span>{isLoading ? 'ওটিপি পাঠানো হচ্ছে...' : 'ওটিপি কোড পাঠান'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      ) : (
        /* Step 2: OTP Verification Component */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>নম্বর পরিবর্তন করুন</span>
            </button>
            <span className="text-slate-400 font-medium">+৮৮ {phoneNumber}</span>
          </div>

          <OtpManager
            phone={phoneNumber}
            onVerify={handleVerifyOtp}
            onResendOtp={handleResendOtp}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* 1-Click Quick Demo Profiles */}
      <div className="pt-2 border-t border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            টেস্টিং ডেমো প্রোফাইল (১-ক্লিক)
          </span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
            Instant
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('hospital_procurement');
              router.push(redirectUrl);
            }}
            className="login-demo-chip flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#1e3932]" />
              <div>
                <p className="text-xs font-bold text-slate-800">হাসপাতাল প্রকিউরমেন্ট ম্যানেজার</p>
                <p className="text-[10px] text-slate-500">সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => {
              loginAsDemoUser('customer');
              router.push(redirectUrl);
            }}
            className="login-demo-chip flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-[#1e3932]" />
              <div>
                <p className="text-xs font-bold text-slate-800">চিকিৎসক / চেম্বার প্র্যাকটিশনার</p>
                <p className="text-[10px] text-slate-500">ডাঃ তৌহিদুর রহমান (এমবিবিএস)</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Bottom Trust Stamp */}
      <div className="pt-3 border-t border-slate-100 text-center">
        <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>DGDA লাইসেন্সপ্রাপ্ত ও NBR মূসক-৬.৩ এনক্রিপ্টেড সিকিউরিটি</span>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

