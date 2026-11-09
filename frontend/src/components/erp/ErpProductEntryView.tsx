'use client';

import React, { useState } from 'react';
import './ErpProductEntryView.css';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  X,
  PackagePlus,
  DollarSign,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { INITIAL_PRODUCTS } from '../../lib/initialProducts';
import { Product, MedicalCategory } from '../../types';

export function ErpProductEntryView() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sbc_custom_products');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form state
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<MedicalCategory>('Home Diagnostics');
  const [retailPrice, setRetailPrice] = useState<number>(1500);
  const [mrp, setMrp] = useState<number>(1800);
  const [costPrice, setCostPrice] = useState<number>(1100);
  const [stock, setStock] = useState<number>(50);
  const [batchNo, setBatchNo] = useState('BATCH-2026-N01');
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [dgdaReg, setDgdaReg] = useState('DGDA-IMP-2026-8812');
  const [origin, setOrigin] = useState('China');
  const [image, setImage] = useState('/images/products/patient-monitor.svg');
  const [isFeatured, setIsFeatured] = useState(false);
  const [shortDesc, setShortDesc] = useState('');

  // Persist products
  const saveProductsList = (updated: Product[]) => {
    setProducts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sbc_custom_products', JSON.stringify(updated));
      window.dispatchEvent(new Event('sbc_products_updated'));
    }
  };

  const handleOpenAddModal = () => {
    setEditingProductId(null);
    setNameEn('');
    setNameBn('');
    setSku(`SBC-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('Home Diagnostics');
    setRetailPrice(1500);
    setMrp(1800);
    setCostPrice(1100);
    setStock(50);
    setBatchNo(`BATCH-2026-${Math.floor(10 + Math.random() * 90)}`);
    setExpiryDate('2028-12-31');
    setDgdaReg('DGDA-IMP-2026-8812');
    setOrigin('China');
    setImage('/images/products/patient-monitor.svg');
    setIsFeatured(false);
    setShortDesc('');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !sku.trim()) {
      showToast('পণ্যের নাম এবং SKU কোড দেওয়া আবশ্যক।', 'error');
      return;
    }

    if (editingProductId) {
      const updated = products.map((p) => {
        if (p._id === editingProductId) {
          return {
            ...p,
            nameEn,
            nameBn: nameBn || nameEn,
            name: nameEn,
            sku,
            category,
            retailPrice,
            price: retailPrice,
            mrp,
            costPrice,
            stock,
            availableStock: stock,
            imageUrl: image,
            image,
            isFeatured,
            dgdaRegistration: dgdaReg,
            countryOfOrigin: origin,
          };
        }
        return p;
      });
      saveProductsList(updated);
      showToast('পণ্য সফলভাবে আপডেট করা হয়েছে!', 'success');
    } else {
      const newProd: Product = {
        _id: `prod-${Date.now()}`,
        sku,
        name: nameEn,
        nameEn,
        nameBn: nameBn || nameEn,
        banglaName: nameBn || nameEn,
        category,
        retailPrice,
        price: retailPrice,
        mrp,
        showroomPrice: mrp,
        costPrice,
        stock,
        availableStock: stock,
        minStockAlert: 10,
        imageUrl: image,
        image,
        gallery: [image],
        averageRating: 5.0,
        rating: 5.0,
        reviewCount: 0,
        ratingCount: 0,
        warrantyPeriod: '1 Year Full Replacement',
        dgdaRegistration: dgdaReg,
        countryOfOrigin: origin,
        isFeatured,
        isNewArrival: true,
        isBestSeller: false,
        isActive: true,
        inStock: true,
        specifications: {
          Category: category,
          Origin: origin,
          Batch: batchNo,
          Expiry: expiryDate,
          Description: shortDesc,
        },
      };
      saveProductsList([newProd, ...products]);
      showToast('নতুন পণ্য ইকমার্স ও ইআরপি ডাটাবেজে সফলভাবে যুক্ত হয়েছে!', 'success');
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('আপনি কি নিশ্চিত যে এই পণ্যটি মুছে ফেলতে চান?')) {
      const updated = products.filter((p) => p._id !== id);
      saveProductsList(updated);
      showToast('পণ্যটি সফলভাবে মুছে ফেলা হয়েছে।', 'info');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.nameBn && p.nameBn.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  return (
    <div className="product-entry-container space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl text-white">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span>প্রডাক্ট এন্ট্রি ও ক্যাটালগ ম্যানেজমেন্ট (ইকমার্স + ইআরপি)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            নতুন মেডিকেল ইকুইপমেন্ট ও সার্জিক্যাল সামগ্রী এন্ট্রি করুন যা সাথে সাথে স্টোরফ্রন্ট ও ইআরপিতে সিঙ্ক হবে
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#1e3932] hover:bg-[#254940] text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#e6b980]" />
          <span>নতুন পণ্য যুক্ত করুন (Add Product)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="পণ্য বা SKU দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['ALL', 'Home Diagnostics', 'Surgical Consumables', 'Patient Monitoring', 'Respiratory Care', 'Hospital Furniture', 'Sterilization & Lab'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1.5 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? 'সকল ক্যাটাগরি' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">SKU / কোড</th>
                <th className="px-4 py-3.5">পণ্যের বিবরণ</th>
                <th className="px-4 py-3.5">ক্যাটাগরি</th>
                <th className="px-4 py-3.5 text-right">বিক্রয় মূল্য (BDT)</th>
                <th className="px-4 py-3.5 text-right">MRP</th>
                <th className="px-4 py-3.5 text-center">স্টক পরিমাণ</th>
                <th className="px-4 py-3.5 text-center">DGDA Reg.</th>
                <th className="px-4 py-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map((prod) => {
                const effectivePrice = prod.retailPrice ?? prod.price ?? 0;
                const effectiveMrp = prod.mrp ?? prod.showroomPrice ?? effectivePrice;
                const effectiveStock = prod.stock ?? prod.availableStock ?? 0;

                return (
                  <tr key={prod._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                      {prod.sku}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-white">{prod.nameEn}</p>
                      <p className="text-[11px] text-slate-400 font-sans">{prod.nameBn || prod.banglaName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-white">
                      ৳{effectivePrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-400 line-through">
                      ৳{effectiveMrp.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          effectiveStock > 20
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : effectiveStock > 0
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {effectiveStock} Units
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-400">
                      {prod.dgdaRegistration || 'DGDA Verified'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleDelete(prod._id)}
                        className="p-1 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 transition-colors"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-emerald-400" />
                <span>নতুন পণ্য এন্ট্রি (Storefront + ERP)</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">পণ্যের নাম (English) *</label>
                  <input
                    type="text"
                    required
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. 10L Medical Oxygen Concentrator"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">পণ্যের নাম (বাংলা) *</label>
                  <input
                    type="text"
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="যেমন: ১০ লিটার অক্সিজেন কনসেনট্রেটর"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">SKU কোড *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ক্যাটাগরি</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedicalCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Home Diagnostics">Home Diagnostics</option>
                    <option value="Surgical Consumables">Surgical Consumables</option>
                    <option value="Patient Monitoring">Patient Monitoring</option>
                    <option value="Respiratory Care">Respiratory Care</option>
                    <option value="Hospital Furniture">Hospital Furniture</option>
                    <option value="Sterilization & Lab">Sterilization & Lab</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Country of Origin</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">বিক্রয় মূল্য (Sale Price ৳) *</label>
                  <input
                    type="number"
                    required
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">MRP রেট (৳)</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ক্রয় মূল্য / Cost Price (৳)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1">ইনভেন্টরি স্টক পরিমাণ *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">ব্যাচ নাম্বার</label>
                  <input
                    type="text"
                    value={batchNo}
                    onChange={(e) => setBatchNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">মেয়াদোত্তীর্ণের তারিখ (Expiry)</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">DGDA রেজিস্ট্রেশন নম্বর</label>
                <input
                  type="text"
                  value={dgdaReg}
                  onChange={(e) => setDgdaReg(e.target.value)}
                  placeholder="DGDA-IMP-2026-..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="হাসপাতাল গ্রেড কোয়ালিটি ও ক্লিনিক্যাল ব্যবহার..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>সংরক্ষণ করুন (Save to DB)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErpProductEntryView;
