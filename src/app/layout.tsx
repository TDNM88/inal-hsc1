import type { ReactNode } from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "London HSC - Giao dịch ngoại hối và đầu tư tài chính",
  description: "Nền tảng giao dịch ngoại hối và đầu tư tài chính hàng đầu tại châu Âu",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex flex-col min-h-screen">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
