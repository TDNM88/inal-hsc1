import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { metadata, viewport } from './metadata';

const inter = Inter({ subsets: ['latin'] });

export { metadata, viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
