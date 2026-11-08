'use client';

import React, { useState } from 'react';
import './RmaStatusCard.css';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  Truck,
  Building2,
  User,
  FileText,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export interface RmaClaimData {
  ticketId: string;
  orderNumber: string;
  serialNumber: string;
  productName: string;
  category: string;
  claimDate: string;
  status: 'SUBMITTED' | 'RECEIVED_AT_LAB' | 'INSPECTION' | 'APPROVED' | 'REJECTED' | 'DISPATCHED';
  currentStep: number; // 1 to 5
  replacementTracking?: string;
  engineerReport?: {
    engineerName: string;
    designation: string;
    inspectionDate: string;
    diagnosis: string;
    calibrationScore?: string;
    resolution: string;
  };
}

const SAMPLE_APPROVED_CLAIM: RmaClaimData = {
  ticketId: 'RMA-2026-0419',
  orderNumber: 'SBC-ORD-2026-9021',
  serialNumber: 'SN-NEB-2026-8941',
  productName: 'Professional Compressor Nebulizer System (SBC-NEB-01)',
  category: 'Power Failure / Pressure Drop',
  claimDate: '০২ নভেম্বর ২০২৬',
  status: 'APPROVED',
  currentStep: 4,
  replacementTracking: 'ST-BD-847291',
  engineerReport: {
    engineerName: 'ইঞ্জি: তানভীর আহমেদ (Biomedical Lead)',
    designation: 'সিনিয়র বায়োমেডিকেল ইঞ্জিনিয়ার, সেন্ট্রাল সার্ভিস ল্যাব',
    inspectionDate: '০৪ নভেম্বর ২০২৬',
    diagnosis: 'কম্প্রেসার পিস্টন সিলিন্ডারে অভ্যন্তরীণ উৎপাদনগত চাপ হ্রাস (Pressure Drop < 1.8 bar) শনাক্ত করা হয়েছে। ব্যবহারকারীর কোনো বাহ্যিক আঘাতের প্রমাণ পাওয়া যায়নি।',
    calibrationScore: 'Pressure Output: 1.4 bar (Standard: 2.2 bar) - DEFECTIVE',
    resolution: 'ওয়ারেন্টি শর্তানুযায়ী নতুন সিল্ড ইউনিট (Serial: SN-NEB-2026-9904) প্রতিস্থাপন অনুমোদন করা হয়েছে।',
  },
};

const SAMPLE_REJECTED_CLAIM: RmaClaimData = {
  ticketId: 'RMA-2026-0388',
  orderNumber: 'SBC-ORD-2026-8104',
  serialNumber: 'SN-OXI-2026-4412',
  productName: 'Fingertip Pulse Oximeter with OLED Display (SBC-OXI-50D)',
  category: 'Display / Power Failure',
  claimDate: '২৫ অক্টোবর ২০২৬',
  status: 'REJECTED',
  currentStep: 4,
  engineerReport: {
    engineerName: 'ইঞ্জি: ফারহানা ইয়াসমিন',
    designation: 'বায়োমেডিকেল কোয়ালিটি অডিটর, সান বার্ড ল্যাব',
    inspectionDate: '২৭ অক্টোবর ২০২৬',
    diagnosis: 'ল্যাব মাইক্রোস্কোপিক পরীক্ষায় মাদারবোর্ডে তরল প্রবেশের কারণে শর্ট-সার্কিট ও ক্ষয় (Corrosion) পাওয়া গেছে। এটি ম্যানুফ্যাকচারার ত্রুটি নয়।',
    calibrationScore: 'Liquid Ingress Detected (Warranty Exclusion Clause 4.2)',
    resolution: 'ওয়ারেন্টির বহির্ভূত শর্তানুযায়ী ফ্রি রিপ্লেসমেন্ট বাতিল করা হয়েছে। পেইড রিপেয়ার সার্ভিস উপলব্ধ।',
  },
};

interface RmaStatusCardProps {
  initialClaim?: RmaClaimData;
  showToggleSwitch?: boolean;
}

export function RmaStatusCard({
  initialClaim,
  showToggleSwitch = true,
}: RmaStatusCardProps) {
  const [claim, setClaim] = useState<RmaClaimData>(
    initialClaim || SAMPLE_APPROVED_CLAIM
  );

  const isApproved = claim.status === 'APPROVED' || claim.status === 'DISPATCHED';
  const isRejected = claim.status === 'REJECTED';

  const steps = [
    {
      step: 1,
      title: 'Claim Submitted & Serial Verified',
      titleBn: 'ক্লেইম দাখিল ও সিরিয়াল যাচাই',
      completed: claim.currentStep >= 1,
      active: claim.currentStep === 1,
    },
    {
      step: 2,
      title: 'Device Received at Biomedical Lab',
      titleBn: 'তেজগাঁও বায়োমেডিকেল ল্যাবে গৃহীত',
      completed: claim.currentStep >= 2,
      active: claim.currentStep === 2,
    },
    {
      step: 3,
      title: 'Technical Inspection & Diagnostic Testing',
      titleBn: 'প্রযুক্তিগত পরীক্ষা ও ডায়াগনস্টিক',
      completed: claim.currentStep >= 3,
      active: claim.currentStep === 3,
    },
    {
      step: 4,
      title: isRejected ? 'Claim Rejected (Warranty Exclusion)' : 'Claim Approved for Replacement',
      titleBn: isRejected ? 'রিপ্লেসমেন্ট ক্লেইম বাতিল' : 'নতুন ইউনিট প্রতিস্থাপন অনুমোদিত',
      completed: claim.currentStep >= 4,
      active: claim.currentStep === 4,
      isError: isRejected,
    },
    {
      step: 5,
      title: 'Replacement Dispatched / Handover',
      titleBn: 'নতুন মালামাল কুরিয়ারে প্রেরণ',
      completed: claim.currentStep >= 5,
      active: claim.currentStep === 5,
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6">
      {/* Top Banner & State Toggle Switch */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#faf8f5] to-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isRejected
                ? 'bg-rose-100 text-rose-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isRejected ? (
              <XCircle className="w-6 h-6" />
            ) : (
              <ShieldCheck className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base font-serif">
                টিকেট #{claim.ticketId}
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isRejected
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isRejected ? 'ক্লেইম প্রত্যাখ্যাত (REJECTED)' : 'অনুমোদিত (APPROVED)'}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              অর্ডার: #{claim.orderNumber} • সিরিয়াল: <strong>{claim.serialNumber}</strong>
            </p>
          </div>
        </div>

        {/* Demo State Switcher */}
        {showToggleSwitch && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto text-xs">
            <span className="text-[10px] text-slate-400 font-bold px-2">ডেমো টেস্ট:</span>
            <button
              type="button"
              onClick={() => setClaim(SAMPLE_APPROVED_CLAIM)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                claim.ticketId === SAMPLE_APPROVED_CLAIM.ticketId
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ভিউ
            </button>
            <button
              type="button"
              onClick={() => setClaim(SAMPLE_REJECTED_CLAIM)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                claim.ticketId === SAMPLE_REJECTED_CLAIM.ticketId
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Rejected ভিউ
            </button>
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 pt-0 space-y-6">
        {/* Device Information Strip */}
        <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ডিভাইস ও সমস্যার বিবরণ
            </span>
            <h4 className="font-bold text-slate-900 text-sm mt-0.5">
              {claim.productName}
            </h4>
            <p className="text-slate-600 mt-0.5">
              অভিযোগ: <strong>{claim.category}</strong>
            </p>
          </div>
          <div className="text-right md:border-l md:border-slate-200 md:pl-4">
            <span className="text-[10px] text-slate-400 block">দাখিলের তারিখ</span>
            <span className="font-semibold text-slate-800">{claim.claimDate}</span>
          </div>
        </div>

        {/* 5-Step Stepper Timeline */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#1e3932]" />
            <span>বায়োমেডিকেল সার্ভিস ও ইন্সপেকশন অগ্রগতি (5-Step RMA Stepper)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
            {steps.map((st) => (
              <div
                key={st.step}
                className={`p-3 rounded-2xl border transition-all text-xs flex flex-col justify-between ${
                  st.isError
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : st.active
                    ? 'bg-[#1e3932]/5 border-2 border-[#1e3932] shadow-2xs'
                    : st.completed
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  {st.isError ? (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  ) : st.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-300 text-[10px] flex items-center justify-center shrink-0">
                      {st.step}
                    </span>
                  )}
                  <span className="text-[11px] truncate">ধাপ {st.step}</span>
                </div>
                <p className="font-semibold leading-tight line-clamp-2">
                  {st.titleBn}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Biomedical Engineer Inspection Notes Box */}
        {claim.engineerReport && (
          <div
            className={`p-5 rounded-2xl border space-y-3 text-xs ${
              isRejected
                ? 'bg-rose-50/60 border-rose-200 text-slate-800'
                : 'bg-emerald-50/60 border-emerald-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Wrench
                  className={`w-4 h-4 ${
                    isRejected ? 'text-rose-600' : 'text-[#1e3932]'
                  }`}
                />
                <h4 className="font-bold text-slate-900 text-sm">
                  বায়োমেডিকেল ইঞ্জিনিয়ারিং ইন্সপেকশন রিপোর্ট (Biomedical Report)
                </h4>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                তারিখ: {claim.engineerReport.inspectionDate}
              </span>
            </div>

            <div className="space-y-2 leading-relaxed">
              <div>
                <span className="font-bold text-slate-700">চিফ ডায়াগনসিস:</span>
                <p className="text-slate-800 mt-0.5">{claim.engineerReport.diagnosis}</p>
              </div>

              {claim.engineerReport.calibrationScore && (
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px]">
                  <strong>ক্যালিগ্রেশন পরিমাপ:</strong> {claim.engineerReport.calibrationScore}
                </div>
              )}

              <div className="pt-1">
                <span className="font-bold text-slate-700">সিদ্ধান্ত ও সমাধান:</span>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {claim.engineerReport.resolution}
                </p>
              </div>
            </div>

            {/* Engineer Signature */}
            <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>পরিদর্শনকারী: <strong>{claim.engineerReport.engineerName}</strong> ({claim.engineerReport.designation})</span>
              <span className="font-mono text-emerald-800 font-bold">✓ ডিজিটালি অনুমোদিত</span>
            </div>
          </div>
        )}

        {/* Action / Next Steps Footer */}
        {isApproved && claim.replacementTracking && (
          <div className="p-4 rounded-2xl bg-[#faf8f5] border border-[#eae5df] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#1e3932]" />
              <div>
                <span className="font-bold text-slate-900">
                  নতুন প্রতিস্থাপিত ডিভাইস প্রেরণ করা হয়েছে
                </span>
                <p className="text-slate-500 text-[11px] font-mono">
                  কুরিয়ার ট্র্যাকিং কোড: <strong>{claim.replacementTracking}</strong>
                </p>
              </div>
            </div>
            <a
              href={`/track?id=${claim.replacementTracking}`}
              className="px-4 py-2 bg-[#1e3932] hover:bg-[#162f29] text-white font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
            >
              <span>পার্সেল ট্র্যাক করুন</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

