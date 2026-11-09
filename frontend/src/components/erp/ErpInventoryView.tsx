'use client';

import React, { useState, useMemo, useEffect } from 'react';
import './ErpInventoryView.css';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpDown,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  X,
  PackagePlus,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  inStock: number;
  reorderLevel: number;
  activeBatch: string;
  mfgDate: string;
  expiryDate: string; // YYYY-MM-DD
  warehouseZone: string;
}

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    sku: 'SBC-CAN-20G',
    name: 'IV Cannula 20G with Injection Port (Pink)',
    category: 'Surgical Consumables',
    inStock: 1250,
    reorderLevel: 500,
    activeBatch: 'BATCH-2024-C20',
    mfgDate: '2024-03-01',
    expiryDate: '2027-02-28', // Valid
    warehouseZone: 'Aisle 3, Rack B (Tejgaon)',
  },
  {
    id: 'inv-2',
    sku: 'SBC-CAN-22G',
    name: 'IV Cannula 22G with Injection Port (Blue)',
    category: 'Surgical Consumables',
    inStock: 340,
    reorderLevel: 400, // Low stock
    activeBatch: 'BATCH-2024-C22',
    mfgDate: '2024-04-10',
    expiryDate: '2027-04-09',
    warehouseZone: 'Aisle 3, Rack C (Tejgaon)',
  },
  {
    id: 'inv-3',
    sku: 'SBC-GLU-ACC',
    name: 'Blood Glucose Monitoring Test Strips (Pack of 50)',
    category: 'Home Diagnostics',
    inStock: 80,
    reorderLevel: 100,
    activeBatch: 'BATCH-2026-GLU1',
    mfgDate: '2025-01-15',
    expiryDate: '2026-12-15', // Expiring in < 60 days
    warehouseZone: 'Climate Controlled Zone (4-8°C)',
  },
  {
    id: 'inv-4',
    sku: 'SBC-SYR-05M',
    name: 'Disposable Sterile Syringe 5ml with Needle (Box of 100)',
    category: 'Surgical Consumables',
    inStock: 15,
    reorderLevel: 50,
    activeBatch: 'BATCH-2023-SYR',
    mfgDate: '2023-08-01',
    expiryDate: '2026-07-31', // Expired!
    warehouseZone: 'Quarantine Section B',
  },
  {
    id: 'inv-5',
    sku: 'SBC-NEB-01',
    name: 'Professional Compressor Nebulizer System',
    category: 'Respiratory Care',
    inStock: 65,
    reorderLevel: 20,
    activeBatch: 'BATCH-2025-NEB8',
    mfgDate: '2025-02-01',
    expiryDate: '2030-01-31',
    warehouseZone: 'Aisle 1, Rack A',
  },
  {
    id: 'inv-6',
    sku: 'SBC-BPM-DIG',
    name: 'Digital Upper Arm Blood Pressure Monitor',
    category: 'Home Diagnostics',
    inStock: 120,
    reorderLevel: 30,
    activeBatch: 'BATCH-2025-BPM4',
    mfgDate: '2025-05-10',
    expiryDate: '2030-05-09',
    warehouseZone: 'Aisle 2, Rack D',
  },
];

export function ErpInventoryView() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // New stock form state
  const [selectedSku, setSelectedSku] = useState(inventory[0]?.sku || '');
  const [addQty, setAddQty] = useState<number>(100);
  const [newBatch, setNewBatch] = useState('');
  const [newMfgDate, setNewMfgDate] = useState('2026-01-01');
  const [newExpiryDate, setNewExpiryDate] = useState('2029-01-01');

  const { showToast } = useToast();

  const [currentDate, setCurrentDate] = useState<Date>(() => new Date('2026-11-09T00:00:00Z'));

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Helper to calculate days until expiry
  const getExpiryStatus = (expiryStr: string) => {
    const expDate = new Date(expiryStr);
    const diffTime = expDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'EXPIRED', color: 'bg-rose-100 text-rose-800 border-rose-200', text: 'মেয়াদোত্তীর্ণ (EXPIRED)' };
    }
    if (diffDays <= 90) {
      return { status: 'EXPIRING_SOON', color: 'bg-amber-100 text-amber-800 border-amber-200', text: `মেয়াদ শেষ হবে ${diffDays} দিনে (FEFO Warning)` };
    }
    return { status: 'VALID', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'বৈধ মেয়াদ (Valid)' };
  };

  // Sort and filter by FEFO (First-Expired, First-Out)
  const sortedAndFiltered = useMemo(() => {
    return inventory
      .filter((item) => {
        const matchCat = selectedCategory === 'ALL' || item.category === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          !q ||
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.activeBatch.toLowerCase().includes(q);
        return matchCat && matchSearch;
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [inventory, selectedCategory, searchQuery]);

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.trim()) {
      showToast('অনুগ্রহ করে ব্যাচ নম্বর প্রদান করুন।', 'error');
      return;
    }

    setInventory((prev) =>
      prev.map((item) => {
        if (item.sku === selectedSku) {
          return {
            ...item,
            inStock: item.inStock + Number(addQty),
            activeBatch: newBatch.trim(),
            mfgDate: newMfgDate,
            expiryDate: newExpiryDate,
          };
        }
        return item;
      })
    );

    showToast(`স্টক সফলভাবে আপডেট হয়েছে (${selectedSku} +${addQty} units)`, 'success');
    setIsAdjustModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SKU, পণ্যের নাম বা ব্যাচ নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1e3932]"
          />
        </div>

        {/* Category & Receive Action */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#1e3932]"
          >
            <option value="ALL">সকল ক্যাটাগরি (All)</option>
            <option value="Surgical Consumables">Surgical Consumables</option>
            <option value="Home Diagnostics">Home Diagnostics</option>
            <option value="Respiratory Care">Respiratory Care</option>
          </select>

          <button
            type="button"
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-4 py-2 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#1e3932]/20 flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <PackagePlus className="w-4 h-4 text-[#e6b980]" />
            <span>নতুন স্টক গ্রহণ / অ্যাডজাস্ট</span>
          </button>
        </div>
      </div>

      {/* FEFO Rules Notice Strip */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>First-Expired, First-Out (FEFO) কার্যকর রয়েছে:</strong> যেসব ব্যাচের মেয়াদ আগে শেষ হবে, ডিসপ্যাচ কিউতে সেগুলো অগ্রাধিকার ভিত্তিতে অটো-অ্যাসাইন হবে।
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 shrink-0">
          DGDA Compliance
        </span>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf8f5] text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3.5">SKU ও পণ্যের বিবরণ</th>
                <th className="p-3.5 text-center">ইন-স্টক ইউনিট</th>
                <th className="p-3.5 text-center">রিঅর্ডার লেভেল</th>
                <th className="p-3.5">সক্রিয় ব্যাচ নম্বর</th>
                <th className="p-3.5">উৎপাদন তারিখ</th>
                <th className="p-3.5">FEFO মেয়াদোত্তীর্ণ তারিখ (Expiry)</th>
                <th className="p-3.5 text-center">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedAndFiltered.map((item) => {
                const exp = getExpiryStatus(item.expiryDate);
                const isLowStock = item.inStock <= item.reorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <div className="font-mono font-bold text-[#1e3932]">
                        {item.sku}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {item.category} • {item.warehouseZone}
                      </div>
                    </td>

                    <td className="p-3.5 text-center font-mono">
                      <div
                        className={`font-extrabold text-sm ${
                          isLowStock ? 'text-rose-600' : 'text-slate-900'
                        }`}
                      >
                        {item.inStock.toLocaleString('en-US')}
                      </div>
                      {isLowStock && (
                        <span className="text-[10px] text-rose-600 font-bold block">
                          Low Stock Alert!
                        </span>
                      )}
                    </td>

                    <td className="p-3.5 text-center font-mono text-slate-500">
                      {item.reorderLevel}
                    </td>

                    <td className="p-3.5 font-mono text-slate-800 font-semibold">
                      {item.activeBatch}
                    </td>

                    <td className="p-3.5 font-mono text-slate-500">
                      {item.mfgDate}
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="font-bold text-slate-800">{item.expiryDate}</span>
                    </td>

                    <td className="p-3.5 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${exp.color}`}
                      >
                        {exp.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-[#faf8f5] flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                নতুন স্টক চালান গ্রহণ ও ব্যাচ এন্ট্রি (Stock In)
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="p-5 sm:p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  পণ্য নির্বাচন করুন (SKU)
                </label>
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-mono focus:outline-none focus:border-[#1e3932]"
                >
                  {inventory.map((i) => (
                    <option key={i.sku} value={i.sku}>
                      {i.sku} — {i.name} (Current: {i.inStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    নতুন ব্যাচ নম্বর (Batch Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-2026-X99"
                    value={newBatch}
                    onChange={(e) => setNewBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    প্রাপ্ত পরিমাণ (Quantity) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={addQty}
                    onChange={(e) => setAddQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    উৎপাদন তারিখ (Mfg Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={newMfgDate}
                    onChange={(e) => setNewMfgDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    মেয়াদ শেষ হওয়ার তারিখ (Expiry Date) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:outline-none focus:border-[#1e3932]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  স্টকে যুক্ত করুন
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
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

