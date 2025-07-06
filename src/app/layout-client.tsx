'use client';

import React from 'react';
import ClientLayout from './ClientLayout';
import '@/lib/ensure-react';

export default function ClientRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
}