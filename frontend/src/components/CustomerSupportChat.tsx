'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actionLink?: {
    label: string;
    href: string;
  };
}

const QUICK_QUESTIONS = [
  '📦 আমার অর্ডার কীভাবে ট্র্যাক করব?',
  '🩺 বিপি মেশিন ও থার্মোমিটারের ওয়ারেন্টি কত দিন?',
  '💉 ক্যানুলা ও সার্জিক্যাল পণ্যের পাইকারি অর্ডার করা যাবে?',
  '🚚 ঢাকার বাইরে ডেলিভারি কত দিনে পাব?'
];

export function CustomerSupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: 'আসসালামু আলাইকুম! সান বার্ড কর্পোরেশনের কাস্টমার কেয়ার ও মেডিকেল হেল্পডেস্কে স্বাগতম। আপনি কোন পণ্য বা অর্ডার সম্পর্কে জানতে চাচ্ছেন?',
      timestamp: 'এইমাত্র',
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
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    // Intelligent Helpdesk Logic
    setTimeout(() => {
      let replyText = '';
      let actionLink: { label: string; href: string } | undefined;

      const q = query.toLowerCase();

      if (q.includes('ট্র্যাক') || q.includes('track') || q.includes('অর্ডার') || q.includes('order')) {
        replyText = 'আপনার অর্ডার লাইভ ট্র্যাক করতে আমাদের ট্র্যাকিং পেজে গিয়ে আপনার ১১ ডিজিটের মোবাইল নম্বর অথবা অর্ডার কোড (যেমন: ORD-2026-XXXX) দিয়ে অনুসন্ধান করুন।';
        actionLink = { label: 'লাইভ ট্র্যাকিং পেজে যান →', href: '/track' };
      } else if (q.includes('বিপি') || q.includes('bp') || q.includes('প্রেশার') || q.includes('pressure') || q.includes('থার্মোমিটার') || q.includes('ওয়ারেন্টি') || q.includes('warranty')) {
        replyText = 'আমাদের ডিজিটাল বিপি মেশিনে ৩ বছরের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি এবং ইনফ্রারেড থার্মোমিটার ও মেশ নেবুলাইজারে ১ বছরের ফুল ওয়ারেন্টি রয়েছে। প্রতিটি পণ্যের সাথে এনবিআর মূসক-৬.৩ চালান ও ওয়ারেন্টি কার্ড সংযুক্ত থাকে।';
      } else if (q.includes('ক্যানুলা') || q.includes('cannula') || q.includes('পাইকারি') || q.includes('wholesale') || q.includes('রেট') || q.includes('হাসপাতাল')) {
        replyText = 'ক্যানুলা ২০জি (গোলাপী) সহ সার্জিক্যাল ডিসপোজেবল সামগ্রী হাসপাতাল ও ক্লিনিকের জন্য কার্টুন বা বাল্ক অর্ডারে পাইকারি রেট প্রযোজ্য। বাল্ক কোটেশনের জন্য আমাদের হটলাইনে যোগাযোগ করতে পারেন।';
        actionLink = { label: 'হটলাইনে কল করুন (01811-000001)', href: 'tel:01811000001' };
      } else if (q.includes('ডেলিভারি') || q.includes('delivery') || q.includes('কুরিয়ার') || q.includes('ঢাকার বাইরে')) {
        replyText = 'ঢাকার সিটির ভেতরে ২৪ ঘণ্টার মধ্যে (ডেলিভারি চার্জ ৳৬০) এবং ঢাকার বাইরে পাঠাও ও স্টেডফাস্ট কুরিয়ারের মাধ্যমে ৪৮-৭২ ঘণ্টার মধ্যে (ডেলিভারি চার্জ ৳১২০) ক্যাশ অন ডেলিভারিতে হোম ডেলিভারি পৌঁছে দেওয়া হয়। ৫০০০ টাকার উপরে অর্ডারে ডেলিভারি সম্পূর্ণ ফ্রি!';
      } else if (q.includes('গ্লুকোজ') || q.includes('glucose') || q.includes('ডায়াবেটিস') || q.includes('স্ট্রিপ')) {
        replyText = 'আমাদের ডিজিটাল ব্লাড গ্লুকোজ মনিটরিং কিটের সাথে ৫০টি টেস্ট স্ট্রিপ এবং ৫০টি স্টেরাইল ল্যানসেট অন্তর্ভুক্ত রয়েছে। মাত্র ৫ সেকেন্ডে রক্তে শর্করার সঠিক রিডিং পাওয়া যায়।';
      } else {
        replyText = 'ধন্যবাদ আপনার বার্তার জন্য। আপনার অনুসন্ধানের বিষয়ে বিস্তারিত সহায়তা করতে আমাদের প্রতিনিধি প্রস্তুত। জরুরি প্রয়োজনে সরাসরি আমাদের অফিসিয়াল হটলাইন 01811-000001 নম্বরে যোগাযোগ করতে পারেন।';
        actionLink = { label: 'সরাসরি হটলাইনে কল দিন', href: 'tel:01811000001' };
      }

      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        sender: 'agent',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
        actionLink,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-full shadow-xl shadow-emerald-700/30 transition-all cursor-pointer group"
          title="কাস্টমার সাপোর্ট লাইভ চ্যাট"
        >
          <div className="relative">
            <Headphones className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 ring-2 ring-emerald-600 animate-ping" />
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline">
            লাইভ কাস্টমার সাপোর্ট
          </span>
          {unreadCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-extrabold bg-amber-400 text-slate-900 rounded-full shadow-xs">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Expanded Support Chat Drawer/Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[380px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
                <Headphones className="w-5 h-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">সান বার্ড হেল্পডেস্ক</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  মেডিকেল ইকুইপমেন্ট ও অর্ডার সহায়তা
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/70 text-xs">
            {/* Trust Info Pill */}
            <div className="text-center">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>সান বার্ড সেন্ট্রাল ওয়্যারহাউজ কাস্টমার কেয়ার</span>
              </span>
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2 ${
                  m.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {m.sender === 'agent' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl p-3 shadow-2xs space-y-1.5 ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                  {m.actionLink && (
                    <a
                      href={m.actionLink.href}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors mt-1"
                    >
                      <span>{m.actionLink.label}</span>
                    </a>
                  )}

                  <div
                    className={`text-[9px] text-right ${
                      m.sender === 'user' ? 'text-emerald-100' : 'text-slate-400'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2 items-center text-slate-400 text-xs pl-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[11px]">প্রতিনিধি টাইপ করছেন...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Question Chips */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 text-slate-600 text-[11px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="আপনার বার্তা বা প্রশ্ন লিখুন..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

