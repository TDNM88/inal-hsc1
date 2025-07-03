import { Metadata, Viewport } from 'next';
import ClientTradeLayout from './client-layout';

export const metadata: Metadata = {
  title: 'Giao dịch - London SSI',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
};

export default function TradeLayout({ children }: { children: React.ReactNode }) {
  // Server component wrapper to apply metadata
  // Wrap children in ClientTradeLayout để có xác thực
  return (
    <ClientTradeLayout>
      {/* Không bọc children trong container nào khác */}
      {children}
    </ClientTradeLayout>
  );
}
