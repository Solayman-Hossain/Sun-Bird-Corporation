import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { CartProvider } from '../context/CartContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Sun Bird Corporation — ইমপোর্টেড মেডিকেল ও ডায়াগনস্টিক স্টোরফ্রন্ট',
  description: 'সান বার্ড কর্পোরেশনের অফিসিয়াল ই-কমার্স ও ক্লাউড ইআরপি প্ল্যাটফর্ম। ক্যানুলা, বিপি মেশিন, ইসিজি ক্যাবল, এনআইভি মাস্ক ও হোম ডায়াগনস্টিক সামগ্রী।',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="bn"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}
