import type { ReactNode } from "react"
import "./globals.css"

export const metadata = {
  title: "London SSI",
  description: "Nền tảng giao dịch ngoại hối và đầu tư tài chính hàng đầu tại châu Âu",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" translate="no">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
        <meta name="viewport"
          content="width=device-width, height=device-height, initial-scale=1.0, user-scalable=no;user-scalable=0;" />
        <title>London SSI</title>
      </head>
      <body className="flex flex-col min-h-screen">
        <div id="root" className="flex-1">
          {children}
        </div>
      </body>
    </html>
  )
}
