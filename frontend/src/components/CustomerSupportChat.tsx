'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import './CustomerSupportChat.css';
import {
  MessageSquare,
  X,
  Send,
  Headphones,
  Bot,
  User,
  ShieldCheck,
  PhoneCall,
  Package,
  Truck,
  Sparkles,
  Wrench,
  AlertCircle,
  ExternalLink,
  Minimize2,
  Stethoscope,
} from 'lucide-react';
import { RmaClaimModal } from './RmaClaimModal';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  sanitized?: boolean;
  actionLink?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

const QUICK_REPLY_CHIPS = [
  '📦 Check Order Status',
  '🛡️ Warranty / RMA Inquiry',
  '🏥 Request Bulk B2B Quotation',
  '👨‍⚕️ Talk to Biomedical Engineer',
];

// Regex filters for security and compliance
const SENSITIVE_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const ABUSIVE_WORDS_REGEX = /\b(scam|fraud|fake|cheat|bastard|idiot)\b/gi;

function sanitizeMessage(text: string): { cleaned: string; wasSanitized: boolean } {
  let wasSanitized = false;
  let cleaned = text;

  if (SENSITIVE_CARD_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(SENSITIVE_CARD_REGEX, '💳 [CARD NUMBER PROTECTED]');
    wasSanitized = true;
  }

  if (ABUSIVE_WORDS_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(ABUSIVE_WORDS_REGEX, '[CENSORED]');
    wasSanitized = true;
  }

  return { cleaned, wasSanitized };
}

export function CustomerSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [isRmaModalOpen, setIsRmaModalOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: 'আসসালামু আলাইকুম! সান বার্ড কর্পোরেশনে স্বাগতম। অর্ডার, ওয়ারেন্টি বা পণ্য, কোন বিষয়ে সাহায্য লাগবে?',
      timestamp: 'Just now',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = (textToSend?: string) => {
    const raw = (textToSend || input).trim();
    if (!raw) return;

    // Apply regex sanitization
    const { cleaned, wasSanitized } = sanitizeMessage(raw);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: cleaned,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      sanitized: wasSanitized,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Realistic automated responder with context awareness
    setTimeout(() => {
      let replyText = '';
      let actionLink: { label: string; href?: string; onClick?: () => void } | undefined;

      const q = raw.toLowerCase();

      if (q.includes('order') || q.includes('অর্ডার') || q.includes('track') || q.includes('ট্র্যাক') || q.includes('st-bd') || q.includes('sbc-ord')) {
        const orderMatch = raw.match(/(?:SBC-ORD-\d+|ORD-\d+|ST-BD-\d+)/i);
        if (orderMatch) {
          replyText = `আপনার কনসাইনমেন্ট কোড (${orderMatch[0]}) সনাক্ত করা হয়েছে। পার্সেলটি বর্তমানে তেজগাঁও হাব থেকে গন্তব্য জেলার পথে ট্রানজিটে রয়েছে।`;
          actionLink = { label: `লাইভ ট্র্যাকিং দেখুন (${orderMatch[0]}) →`, href: `/track?id=${orderMatch[0]}` };
        } else {
          replyText = 'আপনার অর্ডার বা পার্সেল লাইভ ট্র্যাক করতে ১১ ডিজিটের মোবাইল নম্বর অথবা অর্ডার কোড (যেমন: SBC-ORD-2026-9021) প্রদান করুন বা সরাসরি ট্র্যাকিং পেজ পরিদর্শন করুন।';
          actionLink = { label: 'লাইভ পার্সেল ট্র্যাকিং পোর্টাল →', href: '/track' };
        }
      } else if (q.includes('warranty') || q.includes('rma') || q.includes('ওয়ারেন্টি') || q.includes('নষ্ট') || q.includes('defect') || q.includes('damage') || q.includes('রিপ্লেসমেন্ট')) {
        replyText = 'সান বার্ড কর্পোরেশনের সকল মেডিকেল ডিভাইসে ১-৩ বছরের অফিসিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি রয়েছে। ডিভাইসে কোনো সমস্যা হলে এখনই সরাসরি RMA ক্লেইম টিকেট দাখিল করতে পারেন।';
        actionLink = {
          label: 'নতুন RMA ক্লেইম ফর্ম ওপেন করুন 🛡️',
          onClick: () => setIsRmaModalOpen(true),
        };
      } else if (q.includes('quotation') || q.includes('bulk') || q.includes('b2b') || q.includes('পাইকারি') || q.includes('hospital') || q.includes('হাসপাতাল')) {
        replyText = 'হাসপাতাল, ক্লিনিক বা ডায়াগনস্টিক সেন্টারের জন্য ক্যানুলা, সিরিঞ্জ, আইসিইউ বেড এবং পেশেন্ট মনিটরের বাল্ক অর্ডারে স্পেশাল এনবিআর মূসক-৬.৩ চালান ও প্রাতিষ্ঠানিক ডিসকাউন্ট প্রদান করা হয়।';
        actionLink = { label: 'প্রাতিষ্ঠানিক সেলস ডেস্কে কল দিন (+880 1800 000000)', href: 'tel:01800000000' };
      } else if (q.includes('engineer') || q.includes('ইঞ্জিনিয়ার') || q.includes('biomedical') || q.includes('বায়োমেডিকেল') || q.includes('calibration')) {
        replyText = 'আমাদের সিনিয়র বায়োমেডিকেল ইঞ্জিনিয়ার (ইঞ্জি: তানভীর আহমেদ) তেজগাঁও সেন্ট্রাল সার্ভিস ল্যাবে উপলব্ধ আছেন। আপনার ডিভাইসের মডেল ও সমস্যা জানালে আমরা টেকনিক্যাল গাইডেন্স প্রদান করব।';
        actionLink = { label: 'সার্ভিস সেন্টারের বিবরণ দেখুন →', href: '/rma' };
      } else if (q.includes('vat') || q.includes('mushak') || q.includes('ভ্যাট') || q.includes('মূসক') || q.includes('tax') || q.includes('challan')) {
        replyText = 'সান বার্ড কর্পোরেশনের সকল অর্ডারে জাতীয় রাজস্ব বোর্ড (NBR) অনুমোদিত ১৫% মূসক-৬.৩ ট্যাক্স চালানপত্র প্রদান করা হয় (BIN: 002391029-0101)। গ্রাহক ড্যাশবোর্ড থেকে যে কোনো সময় চালান ডাউনলোড করতে পারেন।';
        actionLink = { label: 'আপনার ট্যাক্স চালানপত্র দেখুন →', href: '/account' };
      } else {
        replyText = 'আপনার বার্তার জন্য ধন্যবাদ। সান বার্ড মেডিকেল সাপোর্ট টিম আপনার সেবায় সার্বক্ষণিক নিয়োজিত। জরুরি যে কোনো সহায়তায় সরাসরি আমাদের হটলাইন +880 1800 000000 নম্বরে যোগাযোগ করতে পারেন।';
        actionLink = { label: 'জরুরি হেল্পলাইনে কল করুন', href: 'tel:01800000000' };
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        actionLink,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Stethoscope Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-gradient-to-r from-[#1e3932] to-[#274c43] hover:from-[#162f29] hover:to-[#1e3932] active:scale-95 text-white rounded-full shadow-2xl shadow-[#1e3932]/40 transition-all cursor-pointer group"
          title="24/7 Live Biomedical Support Chat"
          aria-label="Open support chat"
        >
          <div className="relative">
            <Stethoscope className="w-5 h-5 text-[#e6b980] group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#1e3932] animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">
            লাইভ চ্যাট করুন
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-5 h-5 px-1 text-[10px] font-extrabold bg-[#c89348] text-slate-950 rounded-full shadow-xs animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Support Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[400px] h-[550px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#1e3932] p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-[#e6b980]">
                <Stethoscope className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight font-serif">
                    Sun Bird Corporation Support
                  </h3>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold uppercase">
                    Online 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  ডিজিটাল হেল্পডেস্ক ও ওয়ারেন্টি সার্ভিস
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Reply Chips Bar */}
          <div className="p-2.5 bg-[#faf8f5] border-b border-slate-200 overflow-x-auto flex gap-1.5 scrollbar-none">
            {QUICK_REPLY_CHIPS.map((chip, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(chip.replace(/^[^\w]+/, '').trim())}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-[#1e3932] text-[11px] font-medium text-slate-700 hover:text-[#1e3932] transition-colors cursor-pointer shadow-2xs"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gradient-to-b from-white to-[#faf8f5]/60 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'agent' && (
                  <div className="w-7 h-7 rounded-xl bg-[#1e3932] text-[#e6b980] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-2xs space-y-1.5 ${
                    msg.sender === 'user'
                      ? 'bg-[#1e3932] text-white rounded-br-xs'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {msg.sanitized && (
                    <div className="text-[10px] text-amber-200/90 flex items-center gap-1 font-mono">
                      <ShieldCheck className="w-3 h-3" />
                      <span>সংবেদনশীল তথ্য স্বয়ংক্রিয়ভাবে প্রটেক্টেড করা হয়েছে</span>
                    </div>
                  )}

                  {msg.actionLink && (
                    <div className="pt-1 border-t border-slate-100">
                      {msg.actionLink.onClick ? (
                        <button
                          type="button"
                          onClick={msg.actionLink.onClick}
                          className="text-[11px] font-bold text-[#1e3932] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{msg.actionLink.label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : msg.actionLink.href ? (
                        <Link
                          href={msg.actionLink.href}
                          onClick={() => setIsOpen(false)}
                          className="text-[11px] font-bold text-[#1e3932] hover:underline flex items-center gap-1"
                        >
                          <span>{msg.actionLink.label}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : null}
                    </div>
                  )}

                  <span
                    className={`block text-[10px] text-right font-mono ${
                      msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-slate-400 text-xs pl-9">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200" />
                <span className="text-[11px] ml-1">বায়োমেডিকেল টিম টাইপ করছে...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="আপনার বার্তা বা অর্ডার নম্বর লিখুন..."
              className="flex-1 px-3.5 py-2.5 bg-[#faf8f5] border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#1e3932]"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 bg-[#1e3932] hover:bg-[#162f29] active:scale-95 text-white rounded-xl transition-all shadow-md shadow-[#1e3932]/20 cursor-pointer disabled:opacity-40"
              title="Send message"
            >
              <Send className="w-4 h-4 text-[#e6b980]" />
            </button>
          </form>
        </div>
      )}

      {/* Direct RMA Claim Modal from Chatbot */}
      <RmaClaimModal
        isOpen={isRmaModalOpen}
        onClose={() => setIsRmaModalOpen(false)}
      />
    </>
  );
}
