'use client';

import React, { useState, useEffect } from 'react';
import './AccountAddressesTab.css';
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Building2,
  Home,
  Check,
  X,
  Phone,
  User,
} from 'lucide-react';
import { ALL_64_DISTRICTS } from './CheckoutModal';
import { useToast } from '../context/ToastContext';

export interface SavedAddress {
  id: string;
  label: 'Hospital / Clinic' | 'Diagnostic Center' | 'Home' | 'Office' | string;
  recipientName: string;
  phone: string;
  district: string;
  upazila: string;
  streetAddress: string;
  isDefault: boolean;
}

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr_1',
    label: 'Hospital / Clinic',
    recipientName: 'ডাঃ মো: রফিকুল ইসলাম',
    phone: '01711-000000',
    district: 'Dhaka',
    upazila: 'Dhanmondi',
    streetAddress: 'প্লট ১২, রোড ৪, ব্লক ডি, ধানমন্ডি, ঢাকা-১২০৫ (সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স, ৩য় তলা)',
    isDefault: true,
  },
  {
    id: 'addr_2',
    label: 'Home',
    recipientName: 'ডাঃ মো: রফিকুল ইসলাম',
    phone: '01711-000000',
    district: 'Dhaka',
    upazila: 'Gulshan',
    streetAddress: 'বাড়ি #২২, রোড #৬৩, গুলশান-২, ঢাকা-১২১২',
    isDefault: false,
  },
];

export function AccountAddressesTab() {
  const [addresses, setAddresses] = useState<SavedAddress[]>(DEFAULT_ADDRESSES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [label, setLabel] = useState<'Hospital / Clinic' | 'Diagnostic Center' | 'Home' | 'Office'>('Hospital / Clinic');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [upazila, setUpazila] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const { showToast } = useToast();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sunbird_saved_addresses');
      if (saved) {
        setAddresses(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  const saveToStorage = (newList: SavedAddress[]) => {
    setAddresses(newList);
    try {
      localStorage.setItem('sunbird_saved_addresses', JSON.stringify(newList));
    } catch {
      // ignore
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setLabel('Hospital / Clinic');
    setRecipientName('');
    setPhone('');
    setDistrict('Dhaka');
    setUpazila('');
    setStreetAddress('');
    setIsDefault(addresses.length === 0);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setLabel(addr.label as any);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setDistrict(addr.district);
    setUpazila(addr.upazila);
    setStreetAddress(addr.streetAddress);
    setIsDefault(addr.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientName.trim() || !phone.trim() || !streetAddress.trim()) {
      showToast('অনুগ্রহ করে প্রয়োজনীয় সকল তথ্য পূরণ করুন।', 'error');
      return;
    }

    if (editingId) {
      // Edit existing
      const updated = addresses.map((addr) => {
        if (addr.id === editingId) {
          return {
            ...addr,
            label,
            recipientName: recipientName.trim(),
            phone: phone.trim(),
            district,
            upazila: upazila.trim(),
            streetAddress: streetAddress.trim(),
            isDefault: isDefault || addr.isDefault,
          };
        }
        return isDefault ? { ...addr, isDefault: false } : addr;
      });
      saveToStorage(updated);
      showToast('ঠিকানা সফলভাবে আপডেট করা হয়েছে।', 'success');
    } else {
      // Add new
      const newAddress: SavedAddress = {
        id: `addr_${Date.now()}`,
        label,
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        district,
        upazila: upazila.trim(),
        streetAddress: streetAddress.trim(),
        isDefault: isDefault || addresses.length === 0,
      };

      const updated = isDefault
        ? addresses.map((a) => ({ ...a, isDefault: false })).concat(newAddress)
        : [...addresses, newAddress];

      saveToStorage(updated);
      showToast('নতুন ডেলিভারি ঠিকানা যুক্ত করা হয়েছে।', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    saveToStorage(updated);
    showToast('ঠিকানা মুছে ফেলা হয়েছে।', 'info');
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveToStorage(updated);
    showToast('ডিফল্ট ডেলিভারি ঠিকানা পরিবর্তিত হয়েছে।', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Add Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1e3932]" />
            <span>সংরক্ষিত ডেলিভারি ঠিকানা সমূহ (Saved Addresses)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            হাসপাতাল, ক্লিনিক বা বাড়ির ঠিকানা সংরক্ষণ করুন যাতে চেকআউটের সময় এক ক্লিকে সিলেক্ট করা যায়।
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#1e3932]/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>নতুন ঠিকানা যোগ করুন</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 bg-white ${
              addr.isDefault
                ? 'border-2 border-[#1e3932] shadow-sm bg-gradient-to-b from-[#faf8f5]/50 to-white'
                : 'border-slate-200/90 hover:border-slate-300'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#1e3932]/10 text-[#1e3932]">
                  {addr.label === 'Hospital / Clinic' || addr.label === 'Diagnostic Center' ? (
                    <Building2 className="w-3 h-3" />
                  ) : (
                    <Home className="w-3 h-3" />
                  )}
                  <span>{addr.label}</span>
                </span>

                {addr.isDefault && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>ডিফল্ট ঠিকানা</span>
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{addr.recipientName}</span>
                </h4>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{addr.phone}</span>
                </p>
              </div>

              <div className="text-xs text-slate-600 leading-relaxed pt-1 border-t border-slate-100">
                <p className="line-clamp-2">{addr.streetAddress}</p>
                <p className="font-semibold text-slate-800 mt-1">
                  {addr.upazila ? `${addr.upazila}, ` : ''}{addr.district} District
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {!addr.isDefault ? (
                <button
                  type="button"
                  onClick={() => handleSetDefault(addr.id)}
                  className="text-slate-500 hover:text-[#1e3932] font-semibold hover:underline cursor-pointer"
                >
                  ডিফল্ট সেট করুন
                </button>
              ) : (
                <span className="text-emerald-700 font-medium text-[11px]">
                  ✓ প্রাইমারি চেকআউট অ্যাড্রেস
                </span>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(addr)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="এডিট করুন"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                {addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="ডিলিট করুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#faf8f5] flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                {editingId ? 'ঠিকানা সম্পাদনা করুন (Edit Address)' : 'নতুন ডেলিভারি ঠিকানা যোগ করুন'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4 text-xs">
              {/* Type / Label selector */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  ঠিকানার ধরন (Location Label)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Hospital / Clinic', 'Diagnostic Center', 'Home', 'Office'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLabel(t)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        label === t
                          ? 'border-[#1e3932] bg-[#1e3932]/10 text-[#1e3932]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    প্রাপকের নাম (Recipient Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="ডাঃ মোহাম্মদ আশরাফুল ইসলাম"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01711XXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
              </div>

              {/* 64 District Dropdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    জেলা (District) *
                  </label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:border-[#1e3932]"
                  >
                    {ALL_64_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    উপজেলা / থানা (Thana / Upazila)
                  </label>
                  <input
                    type="text"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    placeholder="যেমন: ধানমন্ডি / বনানী / কোতোয়ালী"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  পূর্ণ রাস্তা / বাড়ি / ফ্লোর বিবরণ *
                </label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="বাড়ি নং-১৪, রোড নং-০৭, ব্লক-সি, ৩য় তলা"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:border-[#1e3932] resize-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1e3932] focus:ring-[#1e3932]"
                />
                <span className="font-semibold text-slate-700">
                  এটিকে আমার প্রাইমারি ডেলিভারি ঠিকানা হিসেবে সেট করুন
                </span>
              </label>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  সংরক্ষণ করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

