import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './layout.css';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider } from '../context/AuthContext';
import { AnnouncementBar } from '../components/AnnouncementBar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sunbirdcorp.com'),
  title: 'Sun Bird Corporation | Hospital Equipment & Healthcare Solutions',
  description: 'Importer & distributor of DGDA-approved hospital equipment, home diagnostics, surgical consumables, and NBR Mushak-6.3 compliant medical products.',
  keywords: [
    'Hospital Equipment Bangladesh',
    'Medical Devices Importer',
    'DGDA Approved Diagnostics',
    'IV Cannula',
    'Nebulizer',
    'Digital BP Monitor',
    'ECG Machine',
    'NBR Mushak-6.3 Tax Invoice',
  ],
  authors: [{ name: 'Sun Bird Corporation Ltd.' }],
  openGraph: {
    title: 'Sun Bird Corporation | Precision Healthcare Everyday',
    description: 'Directly imported DGDA-certified hospital equipment, diagnostic devices, and surgical consumables for clinics and homes across Bangladesh.',
    url: 'https://sunbirdcorp.com',
    siteName: 'Sun Bird Corporation',
    locale: 'bn_BD',
    type: 'website',
    images: [
      {
        url: 'https://sunbirdcorp.com/images/og-medical-banner.jpg',
        width: 1200,
        height: 630,
        alt: 'Sun Bird Corporation Medical Equipment',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sun Bird Corporation | Healthcare Solutions',
    description: 'DGDA-certified hospital equipment & diagnostic devices across 64 districts of Bangladesh.',
  },
};

const medicalOrganizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  name: 'Sun Bird Corporation',
  legalName: 'Sun Bird Corporation Ltd.',
  taxID: '002391029-0101',
  url: 'https://sunbirdcorp.com',
  logo: 'https://sunbirdcorp.com/images/sunbird-logo.png',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '12/A Motijheel C/A',
    addressLocality: 'Dhaka',
    postalCode: '1000',
    addressCountry: 'BD',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+880 1711-000000',
    contactType: 'Customer Support',
    areaServed: 'BD',
    availableLanguage: ['Bengali', 'English'],
  },
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
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(medicalOrganizationSchema),
          }}
        />
      </head>
      <body className="app-root-layout min-h-full flex flex-col bg-[#faf8f5] text-slate-800">
        <ToastProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <AnnouncementBar />
                {children}
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
