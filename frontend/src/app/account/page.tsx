'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import './account.css';
import { Navbar } from '../../components/Navbar';
import { CartDrawer } from '../../components/CartDrawer';
import { WishlistDrawer } from '../../components/WishlistDrawer';
import { CustomerSupportChat } from '../../components/CustomerSupportChat';
import { AccountInvoicesTab } from '../../components/AccountInvoicesTab';
import { AccountAddressesTab } from '../../components/AccountAddressesTab';
import { RmaClaimModal } from '../../components/RmaClaimModal';
import { RmaStatusCard } from '../../components/RmaStatusCard';
import { Footer } from '../../components/Footer';
import { MobileBottomNav } from '../../components/MobileBottomNav';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { INITIAL_PRODUCTS } from '../../lib/initialProducts';
import {
  User,
  Package,
  Receipt,
  MapPin,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Clock,
  LogOut,
  Settings,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function CustomerAccountPage() {
  const { user, isAuthenticated, isLoading, loginWithPhone, verifyOtp, logout, loginAsDemoUser, updateProfile } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'invoices' | 'rma' | 'addresses' | 'profile'>('orders');
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);

  // Login form state for unauthenticated users
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Profile Edit State
  const [nameEdit, setNameEdit] = useState(user?.name || '');
  const [emailEdit, setEmailEdit] = useState(user?.email || '');
  const [orgEdit, setOrgEdit] = useState(user?.organization || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.trim().replace(/[- ]/g, '');
    if (!/^(?:\+?88)?01[3-9]\d{8}$/.test(cleanPhone)) {
      showToast('সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 01711XXXXXX)', 'error');
      return;
    }
    setAuthLoading(true);
    const res = await loginWithPhone(cleanPhone);
    setAuthLoading(false);
    if (res.otpSent) {
      setOtpSent(true);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim()) {
      showToast('অনুগ্রহ করে ৪ ডিজিটের ওটিপি লিখুন', 'error');
      return;
    }
    setAuthLoading(true);
    const cleanPhone = phoneInput.trim().replace(/[- ]/g, '');
    const success = await verifyOtp(cleanPhone, otpInput.trim());
    setAuthLoading(false);
    if (success) {
      setOtpSent(false);
      setPhoneInput('');
      setOtpInput('');
    }
  };

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: nameEdit.trim() || user?.name,
      email: emailEdit.trim() || user?.email,
      organization: orgEdit.trim() || user?.organization,
    });
    showToast('প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে।', 'success');
  };

  const handleReorder = (order: (typeof pastOrders)[0]) => {
    const prod = INITIAL_PRODUCTS[0];
    addToCart(prod, 1);
    showToast(`Order #${order.orderId}-এর আইটেমসমূহ কার্টে যুক্ত করা হয়েছে!`, 'success');
    setIsCartOpen(true);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('বর্তমান ও নতুন পাসওয়ার্ড পূরণ করুন', 'error');
      return;
    }
    showToast('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!', 'success');
    setCurrentPassword('');
    setNewPassword('');
  };

  const pastOrders = [
    {
      orderId: 'SBC-ORD-2026-9021',
      date: '০৩ নভেম্বর ২০২৬',
      challanNumber: 'CH-2026-9021',
      itemsCount: 4,
      totalAmount: 17768,
      paymentMethod: 'ONLINE_SSLCOMMERZ',
      status: 'DELIVERED',
      itemsSummary: 'Professional Nebulizer (2 Sets), IV Cannula 20G (5 Boxes)',
    },
    {
      orderId: 'SBC-ORD-2026-8720',
      date: '২৮ অক্টোবর ২০২৬',
      challanNumber: 'CH-2026-8720',
      itemsCount: 2,
      totalAmount: 7660,
      paymentMethod: 'COD',
      status: 'DELIVERED',
      itemsSummary: 'Digital Upper Arm BP Monitor (2 Pcs), Infrared Thermometer (1 Pc)',
    },
    {
      orderId: 'SBC-ORD-2026-8104',
      date: '১৫ অক্টোবর ২০২৬',
      challanNumber: 'CH-2026-8104',
      itemsCount: 1,
      totalAmount: 3860,
      paymentMethod: 'COD',
      status: 'DELIVERED',
      itemsSummary: 'Fingertip Pulse Oximeter with OLED Display (2 Pcs)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col font-sans text-slate-800">
      <Navbar showSearch={false} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-[#1e3932] flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>হোমে ফিরে যান</span>
          </Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">গ্রাহক অ্যাকাউন্ট ও পোর্টাল</span>
        </div>

        {/* UNAUTHENTICATED: Show Login / Demo Login View */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-[#1e3932]/10 text-[#1e3932] flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 font-serif">
                গ্রাহক পোর্টালে লগইন করুন
              </h2>
              <p className="text-xs text-slate-500">
                আপনার মোবাইল নম্বরে ওটিপি কোড পাঠিয়ে তাৎক্ষণিক লগইন করুন।
              </p>
            </div>

            {/* OTP Flow Form */}
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর (১১ ডিজিট)
                  </label>
                  <input
                    type="tel"
                    required
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="01711XXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:border-[#1e3932] focus:ring-2 focus:ring-[#1e3932]/10"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#1e3932]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{authLoading ? 'কোড পাঠানো হচ্ছে...' : 'ওটিপি কোড পাঠান'}</span>
                  <ArrowRight className="w-4 h-4 text-[#e6b980]" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <p>
                    একটি ৪ ডিজিটের যাচাইকরণ কোড পাঠানো হয়েছে: <strong>{phoneInput}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">
                    (ডেমো টেস্টিং কোড: <strong>1234</strong>)
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ৪ ডিজিটের ওটিপি লিখুন
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="1234"
                    className="w-full text-center tracking-widest text-lg font-mono px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex-1 py-3 bg-[#1e3932] hover:bg-[#162f29] text-white font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
                  >
                    যাচাই করুন ও প্রবেশ করুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    নম্বর পরিবর্তন
                  </button>
                </div>
              </form>
            )}

            {/* Quick 1-Click Demo Profiles */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                অথবা ১-ক্লিক ডেমো অ্যাকাউন্ট সিলেক্ট করুন
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => loginAsDemoUser('hospital_procurement')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-[#faf8f5] hover:border-[#1e3932] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#1e3932]" />
                    <span>Hospital B2B</span>
                  </div>
                  <div className="text-[10px] text-slate-500">ড. রফিকুল (Director)</div>
                </button>

                <button
                  type="button"
                  onClick={() => loginAsDemoUser('customer')}
                  className="p-2.5 rounded-xl border border-slate-200 bg-[#faf8f5] hover:border-[#1e3932] text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-slate-900 flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#c89348]" />
                    <span>Customer</span>
                  </div>
                  <div className="text-[10px] text-slate-500">হোম হেলথকেয়ার বায়ার</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* AUTHENTICATED: Full Account Portal */
          <div className="space-y-6">
            {/* Profile Welcome Banner */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1e3932] to-[#2d5248] text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-[#1e3932]/20">
                  <User className="w-8 h-8 text-[#e6b980]" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif">
                      {user?.name}
                    </h1>
                    <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      {user?.role === 'hospital_procurement' ? 'Hospital B2B Buyer' : 'Verified Buyer'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {user?.organization || 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স'} • <span className="font-mono text-slate-700">{user?.phone}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    আইডি: {user?.id} • জেলা: {user?.district || 'Dhaka'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  type="button"
                  onClick={logout}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>লগআউট</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs (5 Tabs) */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'bg-[#1e3932] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>অর্ডার হিস্ট্রি ({pastOrders.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'invoices'
                    ? 'bg-[#1e3932] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>কর চালানপত্র (মূসক-৬.৩)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('rma')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'rma'
                    ? 'bg-[#1e3932] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>ওয়ারেন্টি ও RMA ক্লেইম</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('addresses')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'addresses'
                    ? 'bg-[#1e3932] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>সংরক্ষিত ঠিকানা</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'bg-[#1e3932] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>প্রোফাইল সেটিংস</span>
              </button>
            </div>

            {/* TAB 1: Order History */}
            {activeTab === 'orders' && (
              <div className="space-y-4 animate-in fade-in">
                {pastOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:border-[#1e3932]/40 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          #{order.orderId}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">{order.date}</span>
                        <span className="text-slate-400">•</span>
                        <span className="font-mono text-[#1e3932] font-semibold">
                          চালান: {order.challanNumber}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-[11px] self-start sm:self-auto flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ডেলিভারি সম্পন্ন</span>
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="text-xs text-slate-700 font-medium">
                          {order.itemsSummary}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          পেমেন্ট মেথড: {order.paymentMethod === 'ONLINE_SSLCOMMERZ' ? 'অনলাইন পে (SSLCOMMERZ)' : 'ক্যাশ অন ডেলিভারি (COD)'}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-4 self-end sm:self-auto">
                        <div>
                          <span className="text-[10px] text-slate-400 block">মোট পরিশোধিত</span>
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            ৳{order.totalAmount.toLocaleString('en-US')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="px-3.5 py-2 rounded-xl bg-[#1e3932] hover:bg-[#162f29] text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-[#e6b980]" />
                            <span>রি-অর্ডার (Reorder)</span>
                          </button>

                          <Link
                            href={`/track?id=${order.orderId}`}
                            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>ট্র্যাক</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: NBR Mushak-6.3 Tax Invoices */}
            {activeTab === 'invoices' && (
              <div className="animate-in fade-in">
                <AccountInvoicesTab />
              </div>
            )}

            {/* TAB 3: Warranty & RMA Tickets */}
            {activeTab === 'rma' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-serif">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>ওয়ারেন্টি ক্লেইম ও বায়োমেডিকেল সাপোর্ট পোর্টাল (RMA Service)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      সান বার্ড কর্পোরেশনের সকল পণ্যে ১ থেকে ৩ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি রয়েছে।
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRmaModalOpen(true)}
                    className="px-5 py-2.5 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#1e3932]/20 cursor-pointer shrink-0"
                  >
                    নতুন ওয়ারেন্টি ক্লেইম করুন
                  </button>
                </div>

                <RmaStatusCard showToggleSwitch={true} />
              </div>
            )}

            {/* TAB 4: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="animate-in fade-in">
                <AccountAddressesTab />
              </div>
            )}

            {/* TAB 5: Profile Settings */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 max-w-xl space-y-5 animate-in fade-in">
                <h3 className="font-bold text-slate-900 text-base">
                  ব্যক্তিগত ও প্রাতিষ্ঠানিক তথ্য আপডেট করুন
                </h3>

                <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      পুরো নাম
                    </label>
                    <input
                      type="text"
                      value={nameEdit}
                      onChange={(e) => setNameEdit(e.target.value)}
                      placeholder={user?.name || 'ডাঃ মো: রফিকুল ইসলাম'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#1e3932]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      ইমেইল ঠিকানা
                    </label>
                    <input
                      type="email"
                      value={emailEdit}
                      onChange={(e) => setEmailEdit(e.target.value)}
                      placeholder={user?.email || 'dr.rafiqul@centraldiag.com'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#1e3932]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      হাসপাতাল / প্রতিষ্ঠানের নাম
                    </label>
                    <input
                      type="text"
                      value={orgEdit}
                      onChange={(e) => setOrgEdit(e.target.value)}
                      placeholder={user?.organization || 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#1e3932]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-[#1e3932]/25 transition-all cursor-pointer"
                    >
                      তথ্য সংরক্ষণ করুন
                    </button>
                  </div>
                </form>

                {/* Password / Security Form */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-[#1e3932]" />
                    <span>পাসওয়ার্ড পরিবর্তন (Security & Password)</span>
                  </h4>
                  <form onSubmit={handlePasswordChange} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        বর্তমান পাসওয়ার্ড
                      </label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1e3932]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        নতুন পাসওয়ার্ড
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৬ ডিজিটের নতুন পাসওয়ার্ড"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1e3932]"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      পাসওয়ার্ড আপডেট করুন
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <RmaClaimModal
        isOpen={isRmaModalOpen}
        onClose={() => setIsRmaModalOpen(false)}
      />

      <CartDrawer onProceedToCheckout={() => {}} />
      <WishlistDrawer />
      <CustomerSupportChat />
      <Footer />
      <div className="h-16 lg:hidden" />
      <MobileBottomNav />
    </div>
  );
}
