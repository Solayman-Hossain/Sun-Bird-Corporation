'use client';

import React, { useState } from 'react';
import SunBirdHomepage from '../components/SunBirdHomepage';
import { CartDrawer } from '../components/CartDrawer';
import { WishlistDrawer } from '../components/WishlistDrawer';
import { CheckoutModal } from '../components/CheckoutModal';
import { OrderSuccessModal } from '../components/OrderSuccessModal';
import { CustomerSupportChat } from '../components/CustomerSupportChat';
import { Footer } from '../components/Footer';
import { OrderConfirmation } from '../types';

export default function HomePage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderConfirmation | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Meena Bazar Style Category-Grouped Dynamic Storefront */}
      <div className="flex-1">
        <SunBirdHomepage />
      </div>

      {/* Modals, Drawers & Checkout Overlays */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />
      <WishlistDrawer />
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={(order) => {
          setIsCheckoutOpen(false);
          setConfirmedOrder(order);
        }}
      />

      <OrderSuccessModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
      />

      {/* Customer Support Floating Helpdesk */}
      <CustomerSupportChat />

      {/* Regulatory & Enterprise Medical Footer */}
      <Footer />
    </div>
  );
}
