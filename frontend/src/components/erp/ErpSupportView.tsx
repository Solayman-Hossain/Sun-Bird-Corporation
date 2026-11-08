'use client';

import React, { useState } from 'react';
import './ErpSupportView.css';
import {
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  User,
  Phone,
  Send,
  Image as ImageIcon,
  ZoomIn,
  X,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export interface SupportTicketItem {
  id: string;
  type: 'RMA_CLAIM' | 'LIVE_CHAT';
  ticketNumber: string;
  customerName: string;
  customerPhone: string;
  orderNumber: string;
  serialNumber?: string;
  productName: string;
  category: string;
  description: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'REPAIR_SCHEDULED';
  date: string;
  proofImages: string[];
  engineerNotes?: string;
  chatHistory: { sender: 'customer' | 'support'; text: string; time: string }[];
}

const INITIAL_SUPPORT_TICKETS: SupportTicketItem[] = [
  {
    id: 't-1',
    type: 'RMA_CLAIM',
    ticketNumber: 'RMA-2026-0419',
    customerName: 'ডাঃ মো: রফিকুল ইসলাম',
    customerPhone: '01711-234567',
    orderNumber: 'SBC-ORD-2026-9021',
    serialNumber: 'SN-NEB-2026-8941',
    productName: 'Professional Compressor Nebulizer System (SBC-NEB-01)',
    category: 'Power Failure / Pressure Drop',
    description: 'কম্প্রেসার মোটর চালু হলেও অ্যারোসল বাষ্পীভবনের জন্য প্রয়োজনীয় প্রেশার তৈরি হচ্ছে না। প্রেসার গেজে ১.৪ বার রিডিং আসছে।',
    status: 'PENDING_REVIEW',
    date: 'Today, 09:45 AM',
    proofImages: [
      '/images/products/SBC-NEB-01.svg',
    ],
    chatHistory: [
      { sender: 'customer', text: 'মেশিনটি হাসপাতালে ব্যবহারের জন্য জরুরী। দ্রুত রিপ্লেসমেন্ট প্রয়োজন।', time: '10:00 AM' },
      { sender: 'support', text: 'আপনার অভিযোগটি বায়োমেডিকেল ল্যাবে ফরওয়ার্ড করা হয়েছে।', time: '10:15 AM' },
    ],
  },
  {
    id: 't-2',
    type: 'RMA_CLAIM',
    ticketNumber: 'RMA-2026-0388',
    customerName: 'কামরুল হাসান (ফার্মাসিস্ট)',
    customerPhone: '01811-345678',
    orderNumber: 'SBC-ORD-2026-8104',
    serialNumber: 'SN-OXI-2026-4412',
    productName: 'Fingertip Pulse Oximeter with OLED Display',
    category: 'Display / Power Failure',
    description: 'ব্যাটারি পরিবর্তন করার পরও ডিসপ্লেতে কোনো রিডিং আসে না। ভেতরের সার্কিটে পানির দাগ দেখা গেছে।',
    status: 'PENDING_REVIEW',
    date: 'Yesterday, 04:20 PM',
    proofImages: [
      '/images/products/SBC-OXI-50D.svg',
    ],
    chatHistory: [
      { sender: 'customer', text: 'অক্সিজেন মাপার সময় ডিভাইসটি ড্রপ খেয়েছিল।', time: '04:30 PM' },
    ],
  },
  {
    id: 't-3',
    type: 'LIVE_CHAT',
    ticketNumber: 'CHAT-2026-102',
    customerName: 'মেডিসিন কর্নার ফার্মেসি',
    customerPhone: '01911-556677',
    orderNumber: 'SBC-ORD-2026-9022',
    productName: 'IV Cannula 20G Pink (50 Pcs Box)',
    category: 'Bulk Order & Tax Invoice Inquiry',
    description: 'হাসপাতালের জন্য ৫০ বক্স ক্যানুলার মূসক-৬.৩ চালান কপি ইমেইলে পাওয়া যাবে কি না?',
    status: 'PENDING_REVIEW',
    date: 'Today, 11:10 AM',
    proofImages: [],
    chatHistory: [
      { sender: 'customer', text: 'আমাদের হাসপাতালের টিন ও বিন নম্বর সংযুক্ত করা হয়েছে।', time: '11:15 AM' },
    ],
  },
];

export function ErpSupportView() {
  const [tickets, setTickets] = useState<SupportTicketItem[]>(INITIAL_SUPPORT_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(tickets[0]?.id || '');
  const [replyInput, setReplyInput] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [rejectReasonModal, setRejectReasonModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const { showToast } = useToast();

  const selectedTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleDecision = (decision: 'APPROVED' | 'REJECTED' | 'REPAIR_SCHEDULED', note?: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === selectedTicketId) {
          return {
            ...t,
            status: decision,
            engineerNotes: note || (decision === 'APPROVED' ? 'ওয়ারেন্টি রিপ্লেসমেন্ট অনুমোদন করা হয়েছে।' : 'ক্লেমটি শর্তানুযায়ী বাতিল করা হয়েছে।'),
          };
        }
        return t;
      })
    );

    if (decision === 'APPROVED') {
      showToast(`টিকেট #${selectedTicket.ticketNumber} অনুমোদন (APPROVED) সম্পন্ন হয়েছে।`, 'success');
    } else if (decision === 'REJECTED') {
      showToast(`টিকেট #${selectedTicket.ticketNumber} বাতিল (REJECTED) করা হয়েছে।`, 'info');
      setRejectReasonModal(false);
      setRejectReason('');
    } else {
      showToast(`টিকেট #${selectedTicket.ticketNumber} রিপেয়ারের জন্য নির্ধারিত হয়েছে।`, 'info');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === selectedTicketId) {
          return {
            ...t,
            chatHistory: [
              ...t.chatHistory,
              {
                sender: 'support',
                text: replyInput.trim(),
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              },
            ],
          };
        }
        return t;
      })
    );

    showToast('গ্রাহকের কাছে উত্তর সফলভাবে পাঠানো হয়েছে।', 'success');
    setReplyInput('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-[600px]">
      {/* LEFT PANEL: Tickets Queue (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#faf8f5]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#1e3932]" />
            <h3 className="font-bold text-slate-900 text-sm">
              RMA ক্লেইম ও সাপোর্ট ইনবক্স
            </h3>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
            {tickets.filter((t) => t.status === 'PENDING_REVIEW').length} Pending
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {tickets.map((t) => {
            const isSelected = t.id === selectedTicketId;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTicketId(t.id)}
                className={`p-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e3932]/5 border-l-4 border-[#1e3932]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono font-bold text-slate-900">
                    {t.ticketNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                      t.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : t.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                <div className="font-semibold text-slate-800 text-xs">
                  {t.customerName}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  #{t.orderNumber}
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1 mt-1">
                  {t.productName}
                </p>
                <span className="text-[10px] text-slate-400 font-mono block mt-1">
                  {t.date}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL: Detailed Inspection & Actions (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex flex-col overflow-hidden">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-[#faf8f5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-base font-serif">
                    টিকেট #{selectedTicket.ticketNumber}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-[#1e3932]/10 text-[#1e3932]">
                    {selectedTicket.type}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  অর্ডার: #{selectedTicket.orderNumber}
                  {selectedTicket.serialNumber && ` • সিরিয়াল: ${selectedTicket.serialNumber}`}
                </p>
              </div>

              {/* Decision Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDecision('APPROVED')}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approve Replacement</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRejectReasonModal(true)}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>

            {/* Scrollable Inspection Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Customer & Issue Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    গ্রাহকের যোগাযোগ তথ্য
                  </span>
                  <div className="font-bold text-slate-900">{selectedTicket.customerName}</div>
                  <div className="font-mono text-slate-600 flex items-center gap-1.5 pt-0.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedTicket.customerPhone}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    ডিভাইস ও সমস্যার ধরন
                  </span>
                  <div className="font-bold text-slate-900">{selectedTicket.productName}</div>
                  <div className="text-slate-600 font-medium">অভিযোগ: {selectedTicket.category}</div>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-xl bg-[#faf8f5] border border-[#eae5df] space-y-1.5">
                <span className="font-bold text-slate-800 block">
                  গ্রাহকের রিপোর্টকৃত বিস্তারিত বিবরণ:
                </span>
                <p className="text-slate-700 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Photo Proof Viewer with Zoom */}
              {selectedTicket.proofImages && selectedTicket.proofImages.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#1e3932]" />
                    <span>আপলোডকৃত ছবি / প্রমাণাদি ({selectedTicket.proofImages.length})</span>
                  </span>
                  <div className="flex gap-3">
                    {selectedTicket.proofImages.map((src, i) => (
                      <div
                        key={i}
                        onClick={() => setZoomImage(src)}
                        className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden cursor-pointer group shadow-2xs"
                      >
                        <img src={src} alt="Defect proof" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <ZoomIn className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conversation Stream */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#1e3932]" />
                  <span>গ্রাহক সহায়তা কথোপকথন হিস্ট্রি</span>
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedTicket.chatHistory.map((ch, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl text-xs max-w-md ${
                        ch.sender === 'support'
                          ? 'bg-[#1e3932]/10 text-slate-900 ml-auto'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p>{ch.text}</p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1 text-right">
                        {ch.sender === 'support' ? 'সাপোর্ট ডেস্ক' : 'গ্রাহক'} • {ch.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Response Composer */}
            <form onSubmit={handleSendReply} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
              <input
                type="text"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                placeholder="গ্রাহকের কাছে মেসেজ লিখুন..."
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e3932]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#1e3932] hover:bg-[#162f29] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5 text-[#e6b980]" />
                <span>পাঠান</span>
              </button>
            </form>
          </>
        ) : (
          <div className="p-12 text-center text-slate-400">কোন টিকেট নির্বাচন করা হয়নি।</div>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-2xl max-h-[85vh] bg-white rounded-2xl overflow-hidden p-2 shadow-2xl">
            <img src={zoomImage} alt="Zoomed defect proof" className="max-w-full max-h-[80vh] object-contain rounded-xl" />
            <button
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h4 className="font-bold text-slate-900 text-sm">ক্লেইম বাতিলের কারণ সুনির্দিষ্ট করুন</h4>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="যেমন: ডিভাইসের ওয়ারেন্টির শর্ত ভঙ্গ করে বাইরে রিপেয়ার করা হয়েছে অথবা তরল প্রবেশের কারণে নষ্ট হয়েছে..."
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-rose-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleDecision('REJECTED', rejectReason || 'ওয়ারেন্টি শর্ত বহির্ভূত')}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                বাতিল নিশ্চিত করুন
              </button>
              <button
                type="button"
                onClick={() => setRejectReasonModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
              >
                ফিরে যান
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

