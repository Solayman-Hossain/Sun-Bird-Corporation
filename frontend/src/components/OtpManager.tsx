'use client';

import React, { useState, useEffect, useRef } from 'react';
import './OtpManager.css';
import { Clock, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface OtpManagerProps {
  phone: string;
  onVerify: (otp: string) => Promise<boolean>;
  onResendOtp: () => Promise<void>;
  isLoading?: boolean;
  length?: number;
}

export function OtpManager({
  phone,
  onVerify,
  onResendOtp,
  isLoading = false,
  length = 6,
}: OtpManagerProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [canResend, setCanResend] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // 60-second countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Focus first input on mount
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    setErrorMsg('');
    const char = val.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance
    if (char && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit if all filled
    if (newDigits.every((d) => d !== '')) {
      handleComplete(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;

    const newDigits = Array(length).fill('');
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    const nextIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[nextIndex]?.focus();

    if (newDigits.every((d) => d !== '')) {
      handleComplete(newDigits.join(''));
    }
  };

  const handleComplete = async (code: string) => {
    const success = await onVerify(code);
    if (!success) {
      setErrorMsg('ওটিপি কোডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      setDigits(Array(length).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setTimeLeft(60);
    setErrorMsg('');
    setDigits(Array(length).fill(''));
    await onResendOtp();
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="space-y-4 text-center">
      <div className="space-y-1">
        <p className="text-xs text-slate-500">
          <strong className="text-slate-800">{phone}</strong> নম্বরে পাঠানো ৬-সংখ্যার ওটিপি কোডটি লিখুন:
        </p>
      </div>

      {/* 6 Digit Input Group */}
      <div className="otp-digit-group" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            disabled={isLoading}
            className={`otp-digit-input ${digit ? 'filled' : ''}`}
            aria-label={`Digit ${index + 1}`}
          />
        ))}
      </div>

      {errorMsg && (
        <p className="text-xs text-rose-600 font-semibold animate-shake">
          {errorMsg}
        </p>
      )}

      {/* Timer & Resend Button */}
      <div className="flex items-center justify-center gap-3 pt-2">
        {!canResend ? (
          <div className="otp-countdown-badge">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন: <strong>{timeLeft}s</strong></span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1e3932] hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>পুনরায় কোড পাঠান (Resend OTP)</span>
          </button>
        )}
      </div>

      <div className="pt-2">
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>ডেমো কোড: ১২৩৪ বা যেকোনো ৪/৬ ডিজিট</span>
        </span>
      </div>
    </div>
  );
}

export default OtpManager;

