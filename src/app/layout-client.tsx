'use client';

import React from 'react';
import ClientLayout from './ClientLayout';

// Ensure React is available globally
if (typeof window !== 'undefined') {
  window.React = window.React || React;
}

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