'use client';

import React from 'react';
import './page.css';
import { AdminPage, AdminTab } from '../../components/AdminPage';

interface AdminRoutePageProps {
  initialTab?: AdminTab;
}

export default function AdminRoutePage({ initialTab = 'overview' }: AdminRoutePageProps) {
  return (
    <div className="admin-route-wrapper">
      <AdminPage initialTab={initialTab} />
    </div>
  );
}

