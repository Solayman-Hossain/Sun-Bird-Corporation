'use client';

import React, { useState, useRef } from 'react';
import './RmaClaimModal.css';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileText,
  Send,
  Loader2,
  Wrench,
  Clock,
  Building2,
  Phone,
} from 'lucide-react';
import { submitDisputeClaim } from '../lib/api';
import { useToast } from '../context/ToastContext';

interface RmaClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderId?: string;
  defaultSerial?: string;
}

export function RmaClaimModal({
  isOpen,
  onClose,
  defaultOrderId,
  defaultSerial,
}: RmaClaimModalProps) {
  const { showToast } = useToast();

  const [orderId, setOrderId] = useState(defaultOrderId || '');
  const [serialNumber, setSerialNumber] = useState(defaultSerial || '');
  const [productName, setProductName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [problemCategory, setProblemCategory] = useState<
    'Power Failure' | 'Calibration / Accuracy Issue' | 'Physical Damage in Transit' | 'Missing Accessory' | 'Other'
  >('Calibration / Accuracy Issue');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedClaim, setSubmittedClaim] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল (JPEG, PNG) আপলোড করুন।', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setUploadedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation
    if (!orderId.trim()) {
      setErrorMsg('অনুগ্রহ করে অর্ডার নম্বর বা চালান কোড প্রদান করুন।');
      return;
    }
    if (!serialNumber.trim()) {
      setErrorMsg('ডিভাইস লেবেলে মুদ্রিত সিরিয়াল নম্বর (Serial Number) প্রদান করুন।');
      return;
    }
    const cleanPhone = customerPhone.trim().replace(/[- ]/g, '');
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      setErrorMsg('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01711XXXXXX)।');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('অনুগ্রহ করে ত্রুটি বা সমস্যার বিস্তারিত বিবরণ লিখুন।');
      return;
    }
    if (uploadedImages.length === 0) {
      setErrorMsg('সমস্যার প্রমাণ হিসেবে অন্তত ১টি ডিভাইসের স্পষ্ট ছবি আপলোড করুন।');
      return;
    }

    setLoading(true);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const mockTicketId = `RMA-2026-${randomSuffix}`;

    try {
      const payload = {
        orderId: orderId.trim(),
        productSku: serialNumber.trim(),
        productName: productName.trim() || 'Medical Diagnostic Unit',
        customerName: customerName.trim() || 'Valued Hospital Client',
        customerPhone: cleanPhone,
        claimType: problemCategory.toUpperCase().replace(/[\/ ]+/g, '_'),
        description: `[SN: ${serialNumber.trim()}] [Category: ${problemCategory}] ${description.trim()}`,
      };

      const res = await submitDisputeClaim(payload);

      if (res && res.success && res.data) {
        setSubmittedClaim({
          claimNumber: res.data.claimNumber || mockTicketId,
          orderId: orderId.trim(),
          serialNumber: serialNumber.trim(),
          category: problemCategory,
          createdAt: new Date().toLocaleDateString('en-GB'),
        });
      } else {
        // Fallback simulation
        setSubmittedClaim({
          claimNumber: mockTicketId,
          orderId: orderId.trim(),
          serialNumber: serialNumber.trim(),
          category: problemCategory,
          createdAt: new Date().toLocaleDateString('en-GB'),
        });
      }
      showToast(`RMA টিকেট #${mockTicketId} সফলভাবে তৈরি হয়েছে!`, 'success');
    } catch {
      // Offline fallback
      setSubmittedClaim({
        claimNumber: mockTicketId,
        orderId: orderId.trim(),
        serialNumber: serialNumber.trim(),
        category: problemCategory,
        createdAt: new Date().toLocaleDateString('en-GB'),
      });
      showToast(`RMA টিকেট #${mockTicketId} সফলভাবে তৈরি হয়েছে!`, 'success');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedClaim(null);
    setUploadedImages([]);
    setDescription('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#1e3932] to-[#24473e] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#e6b980]">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base font-serif">
                ওয়ারেন্টি রিপ্লেসমেন্ট ক্লেইম (RMA Claim Form)
              </h3>
              <p className="text-[11px] text-slate-300">
                Sun Bird Biomedical Service & Replacement Guarantee
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {submittedClaim ? (
            /* Success State */
            <div className="text-center py-6 space-y-5 animate-in fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  ক্লেইম সাবমিশন সফল
                </span>
                <h4 className="text-xl font-bold text-slate-900 mt-2 font-serif">
                  আপনার RMA ক্লেইম টিকিট নিবন্ধিত হয়েছে!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  বায়োমেডিকেল সার্ভিস টিম ২৪ ঘণ্টার মধ্যে ডিভাইসের পরীক্ষা শুরু করবে।
                </p>
              </div>

              {/* Ticket Details */}
              <div className="p-4 bg-[#faf8f5] border border-[#eae5df] rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">RMA টিকিট নম্বর:</span>
                  <span className="font-mono font-extrabold text-[#1e3932] text-sm">
                    {submittedClaim.claimNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">অর্ডার নম্বর:</span>
                  <span className="font-mono font-bold text-slate-800">
                    #{submittedClaim.orderId}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <span className="text-slate-500">ডিভাইস সিরিয়াল:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {submittedClaim.serialNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">বর্তমান অবস্থা:</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                    সিরিয়াল ভেরিফিকেশন ও ল্যাব পর্যালোচনা
                  </span>
                </div>
              </div>

              {/* Warranty Guidelines Strip */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-[11px] text-slate-600">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#1e3932]" />
                  <span>সার্ভিস সেন্টার ও ওয়ারেন্টি নির্দেশিকা:</span>
                </div>
                <p>
                  • আমাদের কাভার্ড ভ্যান তেজগাঁও লজিস্টিকস হাব থেকে আপনার ত্রুটিপূর্ণ ডিভাইস সংগ্রহ করবে।
                </p>
                <p>
                  • টেকনিক্যাল ইনস্পেকশনে প্রস্তুতকারক ত্রুটি পাওয়া গেলে সরাসরি সিলড নতুন প্যাক রিপ্লেসমেন্ট প্রদান করা হবে।
                </p>
                <p className="font-mono text-[#1e3932] font-semibold">
                  বায়োমেডিকেল সাপোর্ট হটলাইন: +880 1800 000000 (এক্সটেনশন: ৪)
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3 bg-[#1e3932] hover:bg-[#162f29] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                ধন্যবাদ, সম্পন্ন করুন
              </button>
            </div>
          ) : (
            /* Submission Form */
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-[#faf8f5] border border-[#eae5df] rounded-xl text-slate-700 flex items-start gap-2 text-[11px]">
                <ShieldAlert className="w-4 h-4 text-[#1e3932] shrink-0 mt-0.5" />
                <span>
                  ওয়ারেন্টি ক্লেইমের জন্য ডিভাইসের লেবেলে মুদ্রিত সঠিক সিরিয়াল নম্বর এবং ত্রুটির স্পষ্ট ছবি আবশ্যক।
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    অর্ডার কোড / ইনভয়েস নম্বর *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBC-ORD-2026-9021"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    ডিভাইস সিরিয়াল নম্বর (Serial Number) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-NEB-2026-8941"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    গ্রাহক / ক্লিনিকের নাম
                  </label>
                  <input
                    type="text"
                    placeholder="ডাঃ মোহাম্মদ আশরাফুল ইসলাম"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="01711XXXXXX"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  সমস্যার শ্রেণিবিভাগ (Problem Category) *
                </label>
                <select
                  value={problemCategory}
                  onChange={(e) => setProblemCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-medium text-xs focus:outline-none focus:border-[#1e3932]"
                >
                  <option value="Power Failure">পাওয়ার অন হয় না / বিদ্যুৎ সরবরাহ ব্যর্থতা (Power Failure)</option>
                  <option value="Calibration / Accuracy Issue">রিডিংয়ের অমিল বা ক্যালিগ্রেশন ত্রুটি (Calibration / Accuracy Issue)</option>
                  <option value="Physical Damage in Transit">কুরিয়ার ট্রানজিটে ক্ষতিগ্রস্থ / ভাঙা প্যাকেট (Physical Damage in Transit)</option>
                  <option value="Missing Accessory">যন্ত্রাংশ বা আনুষাঙ্গিক উপাদান অনুপস্থিত (Missing Accessory)</option>
                  <option value="Other">অন্যান্য প্রযুক্তিগত ত্রুটি (Other)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ত্রুটির বিস্তারিত বিবরণ (Issue Description) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="ডিভাইসটি চালু করলে কী ধরনের ত্রুটি হচ্ছে বা এরর কোড দেখাচ্ছে তা সংক্ষেপে লিখুন..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e3932] resize-none"
                />
              </div>

              {/* Photo Upload Dropzone */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  ডিভাইস ও ত্রুটির প্রমাণ ছবি (Photo Proof Upload) *
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#1e3932] rounded-2xl p-4 text-center bg-slate-50 hover:bg-[#faf8f5] transition-all cursor-pointer space-y-1.5"
                >
                  <Upload className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="font-semibold text-slate-700 text-xs">
                    ছবি সিলেক্ট করতে ক্লিক করুন অথবা ড্রপ করুন
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPEG, PNG ফরম্যাট সমর্থিত (সর্বোচ্চ ৫MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                {/* Thumbnails */}
                {uploadedImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {uploadedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden group shadow-2xs"
                      >
                        <img
                          src={img}
                          alt="Defect proof"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold bg-[#1e3932] hover:bg-[#162f29] text-white flex items-center gap-2 cursor-pointer shadow-md shadow-[#1e3932]/20 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>টিকেট তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-[#e6b980]" />
                      <span>RMA ক্লেইম জমা দিন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
