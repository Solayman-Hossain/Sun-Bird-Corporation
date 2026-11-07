'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Boxes,
  FileSpreadsheet,
  Layers,
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  TrendingUp,
  Receipt,
  Package,
  AlertCircle,
  Building2,
  Lock,
  RefreshCw,
  MessageSquare,
  Send,
  User,
  Check,
  Headphones,
  MailCheck
} from 'lucide-react';

export default function ErpDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'accounting' | 'lc' | 'inbox' | 'rma' | 'reviews'>('orders');

  // RMA Warranty & Dispute Claims (Prompt 19 & 20)
  const [rmaClaims, setRmaClaims] = useState([
    {
      id: 'claim-1',
      claimNumber: 'RMA-2026-0001',
      orderId: 'ORD-2026-0091',
      customerName: 'ড. মো: রফিকুল ইসলাম',
      customerPhone: '01711-000000',
      productSku: 'MED-BPM-ARM',
      productName: 'Digital Upper Arm BP Monitor',
      claimType: 'DEFECTIVE_PRODUCT',
      description: 'LCD ডিসপ্লে ব্লিঙ্ক করছে এবং রিডিং দিচ্ছে না। রিপ্লেসমেন্ট প্রয়োজন।',
      status: 'PENDING_REVIEW',
      date: 'আজ সকাল ১১:৪৫',
    },
    {
      id: 'claim-2',
      claimNumber: 'RMA-2026-0002',
      orderId: 'ORD-2026-0088',
      customerName: 'মেডিসিন কর্নার ফার্মেসি',
      customerPhone: '01811-000002',
      productSku: 'MED-CAN-020G',
      productName: 'Sterile IV Cannula 20G (Box)',
      claimType: 'DAMAGED_IN_TRANSIT',
      description: 'কুরিয়ার বক্সে প্রেসার পড়ে বাইরের সিল খুলে গেছে।',
      status: 'APPROVED_REPLACEMENT',
      date: 'গতকাল বিকাল ৪:২০',
    },
  ]);

  // Product Reviews Moderation Queue (Prompt 18)
  const [productReviews, setProductReviews] = useState([
    {
      id: 'rev-1',
      productName: 'Digital Upper Arm BP Monitor (MED-BPM-ARM)',
      reviewerName: 'ডাঃ তৌহিদুর রহমান',
      reviewerPhone: '01711-223344',
      rating: 5,
      text: 'অরিজিনাল ইমপোর্টেড প্রোডাক্ট। ক্লিনিক্যাল এক্যুরেসি অত্যন্ত ভালো এবং প্যাকেট সিল্ড পেয়েছি।',
      status: 'APPROVED',
      date: '২ দিন আগে',
    },
    {
      id: 'rev-2',
      productName: 'Portable Ultrasonic Mesh Nebulizer (MED-MSH-NEB)',
      reviewerName: 'ফারহান আহমেদ',
      reviewerPhone: '01911-556677',
      rating: 5,
      text: 'পাঠাও কুরিয়ারের মাধ্যমে ২৪ ঘণ্টার মধ্যেই অক্ষত অবস্থায় ডেলিভারি পেয়েছি। ভ্যাট চালান সাথে ছিল।',
      status: 'APPROVED',
      date: '১ সপ্তাহ আগে',
    },
    {
      id: 'rev-3',
      productName: 'Digital Blood Glucose Kit (DIAG-GLU-KIT)',
      reviewerName: 'কামরুল হাসান',
      reviewerPhone: '01811-778899',
      rating: 4,
      text: 'স্ট্রিপ সহ প্যাকেজটি খুবই ভালো। তবে ইউজার ম্যানুয়াল বাংলায় হলে আরও সুবিধা হতো।',
      status: 'PENDING',
      date: 'এইমাত্র',
    },
  ]);

  // Sample live orders in ERP
  const [orders, setOrders] = useState([
    {
      id: 'ORD-2026-0091',
      date: 'আজ সকাল ১১:২০',
      customerName: 'ড. মো: রফিকুল ইসলাম',
      mobile: '01711-000000',
      items: 'Sterile IV Cannula (20 Pcs), Digital BP Machine (1 Pc)',
      amount: 3650,
      paymentMethod: 'COD',
      status: 'PROCESSING',
      challanNumber: 'CH-2026-0091',
      courier: 'Pathao Courier',
    },
    {
      id: 'ORD-2026-0090',
      date: 'আজ সকাল ১০:০৫',
      customerName: 'মেসার্স মেডিসিন কর্নার (চট্টগ্রাম)',
      mobile: '01811-000002',
      items: '10-Lead ECG Cable (2 Sets), Mesh Nebulizer (3 Sets)',
      amount: 12200,
      paymentMethod: 'ONLINE_SSLCOMMERZ',
      status: 'DISPATCHED',
      challanNumber: 'CH-2026-0090',
      courier: 'Steadfast Courier (ST-4821)',
    },
    {
      id: 'ORD-2026-0089',
      date: 'গতকাল বিকাল ০৪:৩০',
      customerName: 'গ্রিনভিউ ডায়াগনস্টিক',
      mobile: '01911-000003',
      items: 'Blood Glucose Kit (5 Sets), Alcohol Swabs (10 Boxes)',
      amount: 10050,
      paymentMethod: 'COD',
      status: 'DELIVERED',
      challanNumber: 'CH-2026-0089',
      courier: 'Pathao Courier',
    },
  ]);

  // Inventory Batches in Tejgaon Central Depot
  const inventoryBatches = [
    { sku: 'MED-CAN-020G', name: 'Sterile IV Cannula 20G', batch: 'BATCH-CAN-2026A', qty: 2500, uom: 'PCS', cost: 22, mrp: 45, exp: '09/01/2029' },
    { sku: 'MED-TRN-001', name: 'Medical Elastic Tourniquet', batch: 'BATCH-TRN-2026A', qty: 500, uom: 'PCS', cost: 55, mrp: 120, exp: 'N/A (Non-Exp)' },
    { sku: 'MED-ECG-10LD', name: '10-Lead Universal ECG Cable', batch: 'BATCH-ECG-2026A', qty: 150, uom: 'SET', cost: 1400, mrp: 2800, exp: 'N/A (Non-Exp)' },
    { sku: 'MED-NIV-MSK', name: 'NIV Full Face CPAP/BiPAP Mask', batch: 'BATCH-NIV-2026A', qty: 120, uom: 'PCS', cost: 1950, mrp: 3800, exp: 'N/A (Non-Exp)' },
    { sku: 'MED-MSH-NEB', name: 'Portable Ultrasonic Mesh Nebulizer', batch: 'BATCH-MSH-2026A', qty: 300, uom: 'SET', cost: 1150, mrp: 2200, exp: 'N/A (Non-Exp)' },
    { sku: 'DIAG-GLU-KIT', name: 'Blood Glucose Monitor + 50 Strips', batch: 'BATCH-GLU-2026A', qty: 400, uom: 'KIT', cost: 880, mrp: 1650, exp: '04/08/2027' },
    { sku: 'MED-BPM-ARM', name: 'Digital Upper Arm BP Monitor', batch: 'BATCH-BPM-2026A', qty: 250, uom: 'PCS', cost: 1450, mrp: 2750, exp: 'N/A (Non-Exp)' },
    { sku: 'MED-THM-IR01', name: 'Non-Contact Infrared Thermometer', batch: 'BATCH-THM-2026A', qty: 350, uom: 'PCS', cost: 750, mrp: 1450, exp: 'N/A (Non-Exp)' },
    { sku: 'MED-OXI-FNG', name: 'Fingertip Pulse Oximeter SpO2', batch: 'BATCH-OXI-2026A', qty: 400, uom: 'PCS', cost: 480, mrp: 950, exp: 'N/A (Non-Exp)' },
    { sku: 'MED-SWB-ALC', name: '70% Isopropyl Alcohol Swab Pads', batch: 'BATCH-SWB-2026A', qty: 1200, uom: 'BOX', cost: 85, mrp: 180, exp: '31/01/2029' },
  ];

  // Double-Entry Journal Entries
  const journalEntries = [
    {
      jvNumber: 'JV-2026-0412',
      date: '05/11/2026',
      reference: 'E-Commerce Order ORD-2026-0090 (Mushak-6.3)',
      debitAccount: '1030 - SSLCOMMERZ Gateway Clearing / 5010 COGS',
      creditAccount: '4010 - E-Commerce Sales Revenue / 1200 Inventory / 2310 VAT Output',
      amount: 12200,
      balanced: true,
    },
    {
      jvNumber: 'JV-2026-0411',
      date: '04/11/2026',
      reference: 'Pathao Courier COD Remittance Collection',
      debitAccount: '1020 - Current Bank Account',
      creditAccount: '1100 - Trade Debtors (Courier Receivable)',
      amount: 45800,
      balanced: true,
    },
    {
      jvNumber: 'JV-2026-0410',
      date: '01/11/2026',
      reference: 'Import L/C Landed Cost Capitalization LC-DAC-2026-04',
      debitAccount: '1200 - Merchandise Inventory (Medical Devices)',
      creditAccount: '2020 - Accounts Payable Foreign Creditor / C&F Duty',
      amount: 1850000,
      balanced: true,
    },
  ];

  // Slide 37: Customer Support Inquiries with Last Message Preview & Unread Count
  const [inquiries, setInquiries] = useState([
    {
      id: 'INQ-101',
      customerName: 'ড. মো: রফিকুল ইসলাম',
      organization: 'সেন্ট্রাল ডায়াগনস্টিক কমপ্লেক্স',
      mobile: '01711-000000',
      lastMessage: 'আমরা ৫০ বক্স ক্যানুলা ২০জি এবং ২টি ডিজিটাল বিপি মেশিনের বাল্ক কোটেশন চাচ্ছি। ডেলিভারি কি কালকে সম্ভব?',
      unreadCount: 2,
      lastTimestamp: 'আজ সকাল ১১:৪৫',
      status: 'UNREAD',
      history: [
        { sender: 'customer', text: 'আসসালামু আলাইকুম। সান বার্ড কি সরাসরি হাসপাতালে সরবরাহ করে?', time: 'সকাল ১১:৩০' },
        { sender: 'agent', text: 'ওয়ালাইকুমুস সালাম। জী, আমরা সরাসরি তেজগাঁও সেন্ট্রাল ডিপো থেকে ভ্যাট চালানসহ ডেলিভারি দিই।', time: 'সকাল ১১:৩৫' },
        { sender: 'customer', text: 'আমরা ৫০ বক্স ক্যানুলা ২০জি এবং ২টি ডিজিটাল বিপি মেশিনের বাল্ক কোটেশন চাচ্ছি। ডেলিভারি কি কালকে সম্ভব?', time: 'সকাল ১১:৪৫' }
      ]
    },
    {
      id: 'INQ-102',
      customerName: 'মেসার্স মেডিসিন কর্নার (চট্টগ্রাম)',
      organization: 'ফার্মেসি ও সার্জিক্যাল ডিলার',
      mobile: '01811-000002',
      lastMessage: '১০-লিড ইসিজি ক্যাবলের Mindray মেশিনের সাথে পিন কানেক্টর কি ঠিক থাকবে?',
      unreadCount: 1,
      lastTimestamp: 'আজ সকাল ১০:২০',
      status: 'UNREAD',
      history: [
        { sender: 'customer', text: '১০-লিড ইসিজি ক্যাবলের Mindray মেশিনের সাথে পিন কানেক্টর কি ঠিক থাকবে?', time: 'সকাল ১০:২০' }
      ]
    },
    {
      id: 'INQ-103',
      customerName: 'হাসান আহমেদ (ব্যক্তিগত)',
      organization: 'হোম কেয়ার পেশেন্ট',
      mobile: '01611-000004',
      lastMessage: 'মেশ নেবুলাইজারে কি শিশুদের সিলিকন মাস্ক একসাথে থাকে?',
      unreadCount: 1,
      lastTimestamp: 'আজ সকাল ০৯:১৫',
      status: 'UNREAD',
      history: [
        { sender: 'customer', text: 'মেশ নেবুলাইজারে কি শিশুদের সিলিকন মাস্ক একসাথে থাকে?', time: 'সকাল ০৯:১৫' }
      ]
    },
    {
      id: 'INQ-104',
      customerName: 'গ্রিনভিউ ডায়াগনস্টিক',
      organization: 'ক্লিনিক্যাল ল্যাব',
      mobile: '01911-000003',
      lastMessage: 'অর্ডার ORD-2026-0089 এর চালান পেয়েছি। ধন্যবাদ চমৎকার সার্ভিসের জন্য।',
      unreadCount: 0,
      lastTimestamp: 'গতকাল বিকাল ০৫:১০',
      status: 'RESOLVED',
      history: [
        { sender: 'customer', text: 'অর্ডার ORD-2026-0089 এর চালান পেয়েছি। ধন্যবাদ চমৎকার সার্ভিসের জন্য।', time: 'গতকাল বিকাল ০৫:১০' }
      ]
    }
  ]);

  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [replyInput, setReplyInput] = useState('');

  const totalUnreadInquiries = inquiries.reduce((sum, inq) => sum + inq.unreadCount, 0);

  const handleSelectInquiry = (inq: any) => {
    setSelectedInquiry(inq);
    // Mark as read in inbox list
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === inq.id ? { ...item, unreadCount: 0, status: item.status === 'UNREAD' ? 'IN_PROGRESS' : item.status } : item
      )
    );
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !selectedInquiry) return;

    const newReply = {
      sender: 'agent',
      text: replyInput.trim(),
      time: 'এইমাত্র'
    };

    const updatedInquiry = {
      ...selectedInquiry,
      lastMessage: replyInput.trim(),
      lastTimestamp: 'এইমাত্র',
      history: [...selectedInquiry.history, newReply]
    };

    setSelectedInquiry(updatedInquiry);
    setInquiries((prev) =>
      prev.map((item) => (item.id === selectedInquiry.id ? updatedInquiry : item))
    );
    setReplyInput('');
  };

  const handleDispatchOrder = (id: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: 'DISPATCHED', courier: 'Pathao Express Dispatched' } : o
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Navbar */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>স্টোরফ্রন্ট হোম</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white text-sm font-serif">
                SUN BIRD ERP
              </span>
              <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">
                Enterprise Cloud 2026
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-md border border-emerald-800/80">
            <ShieldCheck className="w-4 h-4" />
            <span>সেন্ট্রাল ডাটাবেজ: MongoDB Atlas Replica Set (ACID Synced)</span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span>ইউজার: <strong>Super Admin (Executive)</strong></span>
          </div>
        </div>
      </header>

      {/* Main ERP Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>আজকের মোট বিক্রয়</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">৳ ২৫,৯০০</div>
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>ইকমার্স ও শোরুম POS একীভূত</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>অপেক্ষমাণ ই-কমার্স অর্ডার</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">
              {orders.filter((o) => o.status === 'PROCESSING').length} টি
            </div>
            <div className="text-[11px] text-amber-400">
              চালান ও প্যাকেজিং প্রস্তুত
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>তেজগাঁও সেন্ট্রাল ডিপো ইনভেন্টরি</span>
              <Boxes className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">৬,১৭০ Units</div>
            <div className="text-[11px] text-blue-400">
              ১০টি মেডিকেল SKU অ্যাক্টিভ
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>সাপোর্ট ইনবক্স আনরিড মেসেজ</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-extrabold text-white">{totalUnreadInquiries} টি</div>
            <div className="text-[11px] text-purple-400">
              সরাসরি গ্রাহকদের অনুসন্ধান
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>ই-কমার্স অর্ডার ম্যানেজমেন্ট ({orders.length})</span>
          </button>

          {/* New Tab from Slide 37: Inbox Summary List with Last Message Preview & Unread Count */}
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>কাস্টমার সাপোর্ট ইনবক্স</span>
            {totalUnreadInquiries > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-900">
                {totalUnreadInquiries} New
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>সেন্ট্রাল ডিপো ব্যাচ ইনভেন্টরি (FEFO)</span>
          </button>

          <button
            onClick={() => setActiveTab('accounting')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'accounting'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>ডাবল-এন্ট্রি অ্যাকাউন্টিং লেজার (GL)</span>
          </button>

          <button
            onClick={() => setActiveTab('lc')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'lc'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>ইমপোর্ট এলসি ও ল্যান্ডেড কস্ট</span>
          </button>

          {/* Prompt 19 & 20: RMA Claims & Dispute Resolution Queue */}
          <button
            onClick={() => setActiveTab('rma')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'rma'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>ওয়ারেন্টি ও ডিসপুট ({rmaClaims.filter(c => c.status === 'PENDING_REVIEW').length} New)</span>
          </button>

          {/* Prompt 18: Product Reviews Moderation Queue */}
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>রিভিউ মডারেশন ({productReviews.length})</span>
          </button>
        </div>

        {/* Tab 1: Orders Content */}
        {activeTab === 'orders' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden">
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  অনলাইন ই-কমার্স ও শোরুম অর্ডার সমূহ
                </h3>
                <p className="text-xs text-slate-400">
                  অর্ডার অনুমোদন, চালান ইস্যু ও পাঠাও/স্টেডফাস্ট কুরিয়ার হ্যান্ডওভার
                </p>
              </div>
              <button
                onClick={() => alert('Orders refreshed from MongoDB')}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">অর্ডার / চালান নং</th>
                    <th className="p-3.5">গ্রাহকের নাম ও ফোন</th>
                    <th className="p-3.5">পণ্য তালিকা</th>
                    <th className="p-3.5">মূল্য ও পেমেন্ট</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5 font-mono">
                        <div className="font-bold text-white">{o.id}</div>
                        <div className="text-[11px] text-emerald-400">{o.challanNumber}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-200">{o.customerName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{o.mobile}</div>
                      </td>
                      <td className="p-3.5 max-w-xs text-slate-300 line-clamp-2">
                        {o.items}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">৳ {o.amount.toLocaleString('en-US')}</div>
                        <div className="text-[10px] text-slate-400">{o.paymentMethod}</div>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : o.status === 'DISPATCHED'
                              ? 'bg-blue-950 text-blue-400 border border-blue-800'
                              : 'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {o.status === 'DELIVERED'
                            ? 'ডেলিভার্ড'
                            : o.status === 'DISPATCHED'
                            ? 'কুরিয়ারে ডিসপ্যাচ'
                            : 'প্রসেসিং হচ্ছে'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {o.status === 'PROCESSING' ? (
                          <button
                            onClick={() => handleDispatchOrder(o.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            ডিসপ্যাচ ও কুরিয়ার
                          </button>
                        ) : (
                          <button
                            onClick={() => window.print()}
                            className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs transition-colors cursor-pointer"
                          >
                            চালান দেখুন
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Customer Support Inbox (Slide 37: Last Message Preview + Unread Count) */}
        {activeTab === 'inbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 5 Cols: Inbox Summary List */}
            <div className="lg:col-span-5 bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden space-y-1">
              <div className="p-4 border-b border-slate-700 bg-slate-900/60 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-emerald-400" />
                    <span>গ্রাহক বার্তা ও অনুসন্ধান ইনবক্স</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Last Message Preview + Unread Count
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                  {inquiries.length} Threads
                </span>
              </div>

              {/* Rows List */}
              <div className="divide-y divide-slate-700/60 max-h-[600px] overflow-y-auto">
                {inquiries.map((inq) => {
                  const isSelected = selectedInquiry?.id === inq.id;
                  const hasUnread = inq.unreadCount > 0;

                  return (
                    <div
                      key={inq.id}
                      onClick={() => handleSelectInquiry(inq)}
                      className={`p-4 transition-all cursor-pointer space-y-1.5 ${
                        isSelected
                          ? 'bg-slate-700/80 border-l-4 border-emerald-500'
                          : 'hover:bg-slate-700/40'
                      }`}
                    >
                      {/* Top Row: Name + Timestamp + Unread Badge */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">
                            {inq.customerName}
                          </span>
                          {hasUnread && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 animate-pulse">
                              {inq.unreadCount} New
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {inq.lastTimestamp}
                        </span>
                      </div>

                      {/* Organization / Contact */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{inq.organization}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400">{inq.mobile}</span>
                      </div>

                      {/* Slide 37: Last Message Preview (Truncated) */}
                      <div className="text-xs text-slate-300 line-clamp-1 italic font-sans bg-slate-900/40 px-2 py-1 rounded-md">
                        "{inq.lastMessage}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 7 Cols: Conversation Thread & Response Form */}
            <div className="lg:col-span-7 bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col h-[600px]">
              {selectedInquiry ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-slate-700 bg-slate-900/60 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        {selectedInquiry.customerName}
                      </h4>
                      <div className="text-xs text-slate-400 font-mono">
                        {selectedInquiry.organization} • {selectedInquiry.mobile}
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`কাস্টমার ${selectedInquiry.customerName} এর জন্য ড্রাফট অর্ডার তৈরি পেজে যাচ্ছে`)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      কোটেশন / অর্ডার তৈরি
                    </button>
                  </div>

                  {/* Message History Container */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-900/40 text-xs">
                    {selectedInquiry.history.map((msg: any, idx: number) => (
                      <div
                        key={idx}
                        className={`flex gap-2 ${
                          msg.sender === 'agent' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 shadow-2xs space-y-1 ${
                            msg.sender === 'agent'
                              ? 'bg-emerald-600 text-white rounded-tr-none'
                              : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                          }`}
                        >
                          <div className="text-[10px] text-slate-300 font-bold">
                            {msg.sender === 'agent' ? 'সাপোর্ট এক্সিকিউটিভ (ERP Staff)' : selectedInquiry.customerName}
                          </div>
                          <p className="leading-relaxed">{msg.text}</p>
                          <div className="text-[9px] text-right text-slate-400 font-mono">
                            {msg.time}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Staff Reply Input Form */}
                  <div className="p-3.5 border-t border-slate-700 bg-slate-900/80">
                    <form onSubmit={handleSendReply} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="গ্রাহকের মেসেজের অফিশিয়াল রিপ্লাই টাইপ করুন..."
                        value={replyInput}
                        onChange={(e) => setReplyInput(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        disabled={!replyInput.trim()}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>পাঠান</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                    <MessageSquare className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-white">কোনো বার্তা নির্বাচিত হয়নি</h4>
                  <p className="text-xs max-w-sm text-slate-400">
                    বাম পাশের ইনবক্স তালিকা থেকে যেকোনো গ্রাহকের বার্তার ওপর ক্লিক করে বিস্তারিত দেখুন এবং সরাসরি রিপ্লাই দিন।
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Inventory Batches */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden">
            <div className="p-4 border-b border-slate-700/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  তেজগাঁও সেন্ট্রাল ডিপো (WH-DAC-CENTRAL) ব্যাচ রেজিস্ট্রি
                </h3>
                <p className="text-xs text-slate-400">
                  First-Expired, First-Out (FEFO) নিয়মে স্বয়ংক্রিয় স্টক ডিসপ্যাচ
                </p>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
                ১০টি মেডিকেল পণ্য সংরক্ষিত
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/60 text-slate-400 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">SKU / পণ্যের নাম</th>
                    <th className="p-3.5">ব্যাচ নম্বর</th>
                    <th className="p-3.5">বর্তমান স্টক</th>
                    <th className="p-3.5">ইউনিট কেনা মূল্য (COGS)</th>
                    <th className="p-3.5">খুচরা মূল্য (MRP)</th>
                    <th className="p-3.5">মেয়াদোত্তীর্ণ তারিখ</th>
                    <th className="p-3.5 text-right">অবস্থা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60">
                  {inventoryBatches.map((b) => (
                    <tr key={b.sku} className="hover:bg-slate-700/30 transition-colors">
                      <td className="p-3.5">
                        <div className="font-mono text-emerald-400 font-bold">{b.sku}</div>
                        <div className="text-slate-300 font-medium">{b.name}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{b.batch}</td>
                      <td className="p-3.5 font-bold text-white">
                        {b.qty.toLocaleString('en-US')} {b.uom}
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">৳ {b.cost}</td>
                      <td className="p-3.5 font-bold text-emerald-400">৳ {b.mrp}</td>
                      <td className="p-3.5 text-slate-400">{b.exp}</td>
                      <td className="p-3.5 text-right">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                          স্টকে পর্যাপ্ত
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Double-Entry Accounting */}
        {activeTab === 'accounting' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="font-bold text-white text-sm">
                    ডাবল-এন্ট্রি জেনারেল লেজার (Double-Entry Invariant: Debit ≡ Credit)
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                  ✓ mathematically balanced
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                প্রতিটি ই-কমার্স সেলসের বিপরীতে মানুষের হাত ছাড়াই সিস্টেম স্বয়ংক্রিয়ভাবে ব্যালেন্সড 
                জাবেদা ভাউচার (JV) পোস্ট করে। এর ফলে COGS (বিক্রীত পণ্যের ব্যয়) এবং বিক্রয় আয় মুহূর্তের মধ্যে 
                লাভ-ক্ষতি ও ব্যালেন্স শিটে প্রতিফলিত হয়।
              </p>
            </div>

            <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden">
              <div className="p-4 border-b border-slate-700 text-xs font-bold text-white uppercase tracking-wider">
                সাম্প্রতিক স্বয়ংক্রিয় জাবেদা ভাউচার সমূহ (Journal Entries)
              </div>
              <div className="divide-y divide-slate-700/60 text-xs">
                {journalEntries.map((j) => (
                  <div key={j.jvNumber} className="p-4 space-y-2 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400 text-sm">
                          {j.jvNumber}
                        </span>
                        <span className="text-slate-500 font-mono">{j.date}</span>
                        <span className="text-slate-300 font-medium">{j.reference}</span>
                      </div>
                      <span className="font-extrabold text-white text-sm">
                        ৳ {j.amount.toLocaleString('en-US')}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                        <span className="text-emerald-400 font-bold block">Debit (Dr):</span>
                        <span className="text-slate-300 font-mono">{j.debitAccount}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-700/50">
                        <span className="text-blue-400 font-bold block">Credit (Cr):</span>
                        <span className="text-slate-300 font-mono">{j.creditAccount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Import L/C */}
        {activeTab === 'lc' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="font-bold text-white text-sm">
                ইমপোর্ট এলসি (Letter of Credit) ও ল্যান্ডেড কস্ট ট্র্যাকিং
              </h3>
              <span className="px-2.5 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono">
                LC-DAC-2026-04 (CHITTAGONG PORT)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 space-y-1">
                <span className="text-slate-500 block">বিদেশি সাপ্লায়ার:</span>
                <span className="font-bold text-white text-sm">Mindray Medical International</span>
                <span className="text-[10px] text-slate-400 block">চীন (China) • CIF Chittagong</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 space-y-1">
                <span className="text-slate-500 block">ইনভয়েস মূল্য (USD):</span>
                <span className="font-bold text-emerald-400 text-sm">$ 45,000 USD</span>
                <span className="text-[10px] text-slate-400 block">বিনিময় হার: ৳ ১২২.৫০ / USD</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-700 space-y-1">
                <span className="text-slate-500 block">কাস্টমস ডিউটি ও ল্যান্ডেড কস্ট:</span>
                <span className="font-bold text-white text-sm">৳ ৫,৫১২,৫০০ BDT</span>
                <span className="text-[10px] text-emerald-400 block">ওয়্যারহাউজে খালাস সম্পন্ন</span>
              </div>
            </div>

            <p className="text-slate-400 leading-relaxed pt-2">
              বিদেশ থেকে আসা প্রতিটি চালানের খরচ (এলসি ফি + ইনভয়েস মূল্য + কাস্টমস ট্যাক্স + ফ্রেইট) সরাসরি 
              ইনভেন্টরি ল্যান্ডেড কস্ট মডিউলে যুক্ত হয়ে প্রতিটি পণ্যের নির্ভুল ক্রয়মূল্য (Unit Cost) বের করে দেয়।
            </p>
          </div>
        )}

        {/* Tab 5: RMA Warranty & Dispute Resolution Queue (Prompt 19 & 20) */}
        {activeTab === 'rma' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  ওয়ারেন্টি ক্লেইম, ড্যামেজ ও কাস্টমার ডিসপুট রেজোলিউশন কিউ (RMA Engine)
                </h3>
                <p className="text-xs text-slate-400">
                  গ্রাহকদের জমা দেওয়া ওয়ারেন্টি সার্ভিস ও ডেলিভারি সমস্যা যাচাই-বাছাই ও সমাধান
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold font-mono">
                {rmaClaims.filter(c => c.status === 'PENDING_REVIEW').length} Claims Pending
              </span>
            </div>

            <div className="divide-y divide-slate-700/60 text-xs">
              {rmaClaims.map((claim) => (
                <div key={claim.id} className="p-5 space-y-3 hover:bg-slate-700/20 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400 text-sm">
                        {claim.claimNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-mono">
                        অর্ডার: {claim.orderId}
                      </span>
                      <span className="text-slate-400">{claim.date}</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        claim.status === 'APPROVED_REPLACEMENT'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : claim.status === 'APPROVED_REFUND'
                          ? 'bg-blue-950 text-blue-400 border border-blue-800'
                          : claim.status === 'REJECTED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                      }`}
                    >
                      {claim.status === 'PENDING_REVIEW' && 'অ্যাডমিন রিভিউতে প্রক্রিয়াধীন'}
                      {claim.status === 'APPROVED_REPLACEMENT' && 'রিপ্লেসমেন্ট অনুমোদিত'}
                      {claim.status === 'APPROVED_REFUND' && 'রিফান্ড অনুমোদিত'}
                      {claim.status === 'REJECTED' && 'বাতিল করা হয়েছে'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60">
                    <div>
                      <span className="text-slate-500 block">গ্রাহকের তথ্য:</span>
                      <strong className="text-white">{claim.customerName}</strong> ({claim.customerPhone})
                    </div>
                    <div>
                      <span className="text-slate-500 block">পণ্য ও সমস্যার ধরন:</span>
                      <strong className="text-emerald-400">{claim.productName}</strong> ({claim.productSku})
                      <span className="block text-amber-300 font-medium">ধরন: {claim.claimType}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-700/40 text-slate-300">
                    <strong className="text-slate-400 block text-[11px] mb-1">গ্রাহকের অভিযোগ বিবরণ:</strong>
                    {claim.description}
                  </div>

                  {claim.status === 'PENDING_REVIEW' && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() =>
                          setRmaClaims((prev) =>
                            prev.map((c) =>
                              c.id === claim.id ? { ...c, status: 'REJECTED' } : c
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800 font-semibold cursor-pointer transition-colors"
                      >
                        ক্লেইম বাতিল করুন
                      </button>
                      <button
                        onClick={() =>
                          setRmaClaims((prev) =>
                            prev.map((c) =>
                              c.id === claim.id ? { ...c, status: 'APPROVED_REFUND' } : c
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-blue-900/40 hover:bg-blue-900/60 text-blue-300 border border-blue-800 font-semibold cursor-pointer transition-colors"
                      >
                        রিফান্ড অনুমোদন
                      </button>
                      <button
                        onClick={() =>
                          setRmaClaims((prev) =>
                            prev.map((c) =>
                              c.id === claim.id ? { ...c, status: 'APPROVED_REPLACEMENT' } : c
                            )
                          )
                        }
                        className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer transition-colors shadow-xs"
                      >
                        ✓ নতুন ইউনিট রিপ্লেসমেন্ট অনুমোদন
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Customer Reviews Moderation (Prompt 18) */}
        {activeTab === 'reviews' && (
          <div className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">
                  মেডিকেল ইকুইপমেন্ট কাস্টমার রিভিউ ও স্টার রেটিং মডারেশন
                </h3>
                <p className="text-xs text-slate-400">
                  গ্রাহকদের জমা দেওয়া পণ্য রিভিউ যাচাই ও স্টোরফ্রন্টে প্রকাশের অনুমতি
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                মোট {productReviews.length} টি রিভিউ
              </span>
            </div>

            <div className="divide-y divide-slate-700/60 text-xs">
              {productReviews.map((rev) => (
                <div key={rev.id} className="p-5 space-y-3 hover:bg-slate-700/20 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-400">{rev.productName}</span>
                      <span className="text-slate-400">• {rev.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-400 text-sm">
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)} ({rev.rating}.0)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rev.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {rev.status === 'APPROVED' ? 'স্টোরফ্রন্টে লাইভ' : 'মডারেশন পেন্ডিং'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-white font-medium">{rev.reviewerName}</span>
                    <span>({rev.reviewerPhone})</span>
                  </div>

                  <p className="p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 text-slate-200">
                    "{rev.text}"
                  </p>

                  <div className="flex justify-end gap-2">
                    {rev.status === 'PENDING' ? (
                      <button
                        onClick={() =>
                          setProductReviews((prev) =>
                            prev.map((r) =>
                              r.id === rev.id ? { ...r, status: 'APPROVED' } : r
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                      >
                        ✓ অনুমোদন করুন (Approve)
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          setProductReviews((prev) =>
                            prev.map((r) =>
                              r.id === rev.id ? { ...r, status: 'PENDING' } : r
                            )
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold cursor-pointer"
                      >
                        হাইড / পেন্ডিং করুন
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
