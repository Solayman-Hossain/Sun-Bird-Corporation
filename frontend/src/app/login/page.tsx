'use client';

import React from 'react';
import './page.css';
import { Layout } from '../../components/Layout';
import { LoginPage } from '../../components/LoginPage';

export default function LoginRoutePage() {
  return (
    <Layout showAnnouncement={true} showSearch={false}>
      <div className="login-route-container">
        <LoginPage redirectUrl="/account" />
      </div>
    </Layout>
  );
}

