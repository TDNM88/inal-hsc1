"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"

// Market ticker data
const marketData = [
  { symbol: "US 500 Cash CFD", value: "27,472.5", change: "-7.00 (-0.13%)", color: "text-red-500" },
  { symbol: "EUR to USD", value: "1.0743", change: "-0.01 (-0.49%)", color: "text-red-500" },
  { symbol: "Gold", value: "3,384.44", change: "-0.36 (-0.01%)", color: "text-red-500" },
  { symbol: "Oil", value: "66.15", change: "-0.63 (-0.94%)", color: "text-red-500" },
  { symbol: "S&P 500 Index", value: "5,797", change: "", color: "text-gray-600" },
]

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

// Market ticker component
function MarketTicker() {
  return (
    <div className="bg-white border-b border-gray-200 py-2">
      <div className="container mx-auto px-4">
        <div className="flex items-center space-x-8 text-sm overflow-x-auto">
          {marketData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2 whitespace-nowrap">
              <span className="font-medium text-gray-700">{item.symbol}</span>
              <span className="font-bold">{item.value}</span>
              {item.change && <span className={item.color}>{item.change}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Chart tabs component
function ChartTabs() {
  const [activeTab, setActiveTab] = useState("Indices")
  const tabs = ["Indices", "Forex", "Futures", "Bonds"]

  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Chỉ số xu hướng thị trường</h2>

        {/* Tab navigation */}
        <div className="flex space-x-1 mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Chart area */}
        <div className="bg-gray-50 rounded-lg p-6 h-80 border">
          <div className="w-full h-full flex items-center justify-center">
            <svg width="100%" height="100%" viewBox="0 0 800 300" className="text-blue-500">
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                points="0,150 100,120 200,140 300,100 400,130 500,90 600,110 700,80 800,100"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <polygon
                fill="url(#gradient)"
                points="0,150 100,120 200,140 300,100 400,130 500,90 600,110 700,80 800,100 800,300 0,300"
              />
            </svg>
          </div>
        </div>

        {/* Market data table */}
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between py-3 px-4 border-b bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                SPX
              </div>
              <span className="font-medium">SPX/USD</span>
            </div>
            <div className="text-right">
              <div className="font-bold">6,200.1</div>
              <div className="text-red-500 text-sm">-0.86%</div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 border-b bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                NDX
              </div>
              <span className="font-medium">NDX/USD</span>
            </div>
            <div className="text-right">
              <div className="font-bold">27,472.5</div>
              <div className="text-red-500 text-sm">-0.03%</div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 px-4 border-b bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                US
              </div>
              <span className="font-medium">US30</span>
            </div>
            <div className="text-right">
              <div className="font-bold">44,570.8</div>
              <div className="text-green-500 text-sm">+0.4%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
    return () => setIsVisible(false)
  }, [])

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img src="https://ssi-one.vercel.app/_next/image?url=%2Flogo.png&w=384&q=75" alt="London HSC" className="h-8 w-auto" />
              <span className="text-lg font-bold text-blue-600">LONDON HSC</span>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Trang chủ
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Giao dịch
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Tin tức
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
                Về chúng tôi
              </a>
            </nav>

            {/* Auth buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/login")}
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                Đăng nhập
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Mở tài khoản
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Market ticker */}
      <MarketTicker />

      {/* Main content */}
      <motion.div
        className="container mx-auto px-4 py-6"
        variants={container}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - News */}
          <motion.div className="lg:col-span-1" variants={item}>
            <div
              className="mb-6 bg-cover bg-center bg-no-repeat rounded-lg shadow-md h-48"
              style={{
                backgroundImage: "url(https://ssi-one.vercel.app/_next/image?url=%2Fslide1.jpg&w=384&q=75)",
              }}
            >
              <div className="w-full h-full bg-black bg-opacity-30 rounded-lg flex items-end p-4">
                <div className="text-white">
                  <h3 className="text-sm font-semibold mb-1">London HSC Trading Event</h3>
                  <p className="text-xs opacity-90">Sự kiện giao dịch chứng khoán London</p>
                </div>
              </div>
            </div>

            <h2 className="text-lg font-bold mb-3 text-gray-800">
              Sàn giao dịch chứng khoán London HSC chào đón Thống đốc Samuel Garcia tại Nuevo León, Mexico
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Sàn giao dịch chứng khoán London HSC rất hân hạnh được chào đón Samuel Garcia tại vùng đất lớn của mình,
              nơi ông đã mang lại nhiều cơ hội giao dịch mới trong một thời gian ngắn. Ông đã làm việc với các công ty
              con để đảm bảo các cơ hội trong khu vực của mình và các khu vực khác.
            </p>
          </motion.div>

          {/* Center column - London HSC info */}
          <motion.div className="lg:col-span-1" variants={item}>
            <h2 className="text-xl font-bold mb-4 text-gray-800">LONDON HSC</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              Sàn giao dịch chứng khoán London (HSC) là sàn giao dịch chứng khoán chính ở Vương quốc Anh và lớn nhất ở
              châu Âu. Thành lập chính thức từ năm 1773, các sàn giao dịch khu vực được sáp nhập vào năm 1973 để hình
              thành nên Sàn giao dịch chứng khoán Vương quốc Anh và Ireland, sau đó đổi tên thành Sàn giao dịch chứng
              khoán London (HSC).
            </p>

            <h3 className="text-lg font-bold mb-3 text-gray-800">Nội dung về sàn giao dịch chứng khoán London HSC</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Sàn giao dịch chứng khoán London (HSC) là sàn giao dịch chứng khoán quốc tế nhất với hàng ngàn công ty từ
              hơn 60 quốc gia và là nguồn hàng đầu của tính thanh khoản thị trường vốn, giá chuẩn và dữ liệu thị trường
              ở châu Âu.
            </p>
          </motion.div>

          {/* Right column - Video and FTSE */}
          <motion.div className="lg:col-span-1" variants={item}>
            <div className="mb-6">
              <iframe
                width="100%"
                height="200"
                src="https://www.youtube.com/embed/xnCF64dVscM"
                title="London HSC Trading Platform"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg shadow-md"
              />
            </div>

            {/* FTSE widget */}
            <div className="bg-white border rounded-lg p-4 shadow-md">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">UK</span>
                </div>
                <div>
                  <div className="font-bold text-gray-800">FTSE 100</div>
                  <div className="text-xs text-gray-500">UK 100 • Indices</div>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                8,786.3<span className="text-sm text-gray-500">GBP</span>
              </div>
              <div className="text-red-500 text-sm font-medium">-7.50 (-0.09%)</div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                <div>
                  <div className="text-gray-500">Open</div>
                  <div className="font-medium">8,794.2</div>
                </div>
                <div>
                  <div className="text-gray-500">Close</div>
                  <div className="font-medium">8,786.5</div>
                </div>
                <div>
                  <div className="text-gray-500">High</div>
                  <div className="font-medium">8,800.2</div>
                </div>
                <div>
                  <div className="text-gray-500">Low</div>
                  <div className="font-medium">8,786.3</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Additional slide images */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.img
            src="https://ssi-one.vercel.app/_next/image?url=%2Fslide1-BDdyI_u-.jpg"
            alt="London HSC Trading Floor"
            className="w-full h-64 object-cover rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
          <motion.img
            src="https://ssi-one.vercel.app/_next/image?url=%2Fslide2-B_YnZUXI.jpg"
            alt="Financial Markets"
            className="w-full h-64 object-cover rounded-lg shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      </div>

      {/* Chart section */}
      <ChartTabs />

      {/* WisdomTree section */}
      <motion.div
        className="bg-gradient-to-r from-blue-900 to-purple-900 py-16"
        variants={item}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src="https://ssi-one.vercel.app/_next/image?url=%2Fwisdomtree-banner.png"
                alt="WisdomTree Partnership Banner"
                className="rounded-lg shadow-lg w-full h-auto"
              />
            </div>
            <div className="text-white space-y-4">
              <h2 className="text-3xl font-bold leading-tight">
                Sở giao dịch chứng khoán London HSC và nền tảng WisdomTree ở châu Âu
              </h2>
              <p className="text-sm leading-relaxed opacity-90">
                Quỹ hoán đổi danh mục (ETF) và nhà phát hành sản phẩm giao dịch trao đổi (ETP) toàn cầu, WisdomTree, đã
                kỷ niệm một thập kỷ kinh doanh ở châu Âu tại Sở giao dịch chứng khoán London hôm nay.
              </p>
              <p className="text-sm leading-relaxed opacity-90">
                WisdomTree gia nhập thị trường châu Âu vào năm 2014, dựa trên một chiến dịch thành công ở Mỹ, nơi hoạt
                động kinh doanh ETF của nó được thành lập vào năm 2006.
              </p>
              <Button className="bg-white text-blue-900 hover:bg-gray-100 font-semibold">Tìm hiểu thêm</Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ho Chi Minh Stock Exchange section */}
      <motion.div
        className="bg-purple-100 py-16"
        variants={item}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-purple-900 leading-tight">
                Sở Giao dịch Chứng khoán Thành phố Hồ Chí Minh - Công Ty Cổ Phần Chứng Khoán TP. HCM
              </h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Theo Quyết định số 599/2007/QD-TTg của Thủ tướng Chính phủ năm 2007, Trung tâm Giao dịch Chứng khoán
                  TP.HCM được chuyển đổi thành Sở Giao dịch Chứng khoán TP.HCM, với vốn điều lệ ban đầu là 1.000 tỷ
                  đồng.
                </p>
                <p>
                  Thủ tướng Chính phủ đã ban hành Quyết định số 37/2020/QD-TTg ngày 23/12/2020 về việc thành lập Sở Giao
                  dịch Chứng khoán Việt Nam, đánh dấu một bước phát triển quan trọng trong lịch sử thị trường chứng
                  khoán Việt Nam.
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">Liên hệ chúng tôi</Button>
            </div>
            <div>
              <img
                src="https://ssi-one.vercel.app/_next/image?url=%2Fss.jpg"
                alt="Ho Chi Minh City Skyline"
                className="rounded-lg shadow-xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Gallery section */}
      <motion.div
        className="bg-purple-100 py-8"
        variants={item}
        initial="hidden"
        animate={isVisible ? "show" : "hidden"}
      >
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-center mb-8 text-purple-900">Hình ảnh hoạt động</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <img
              src="https://ssi-one.vercel.app/_next/image?url=%2Fgallery2.jpg"
              alt="London Stock Exchange Building"
              className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
            />
            <img
              src="https://ssi-one.vercel.app/_next/image?url=%2Fgallery3.jpg"
              alt="Trading Floor Activities"
              className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
            />
            <img
              src="https://ssi-one.vercel.app/_next/image?url=%2Fgallery4.jpg"
              alt="Financial District View"
              className="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow"
            />
          </div>
        </div>
      </motion.div>

      {/* Experts section */}
      <motion.div className="py-16 bg-white" variants={item} initial="hidden" animate={isVisible ? "show" : "hidden"}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
            Thông tin các chuyên gia quốc tế có chứng chỉ CFA
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Emmanuel Cau, CFA",
                role: "Giám đốc Sở giao dịch chứng khoán châu Âu, Barclays",
                image: "https://ssi-one.vercel.app/_next/image?url=%2Fexperts/1.jpg",
              },
              {
                name: "Emmanuel CAU",
                role: "Chargé de Communication Marketing",
                image: "https://ssi-one.vercel.app/_next/image?url=%2Fexperts/2.jpg",
              },
              {
                name: "MERAV OZAIR, TIẾN SĨ",
                role: "Tương lai của tài chính: AI đáp ứng được token hóa",
                image: "https://ssi-one.vercel.app/_next/image?url=%2Fexperts/3.jpg",
              },
              {
                name: "Comunidade CFA – Eu me Banco",
                role: "Chuyên gia hoạt động như các nhà phân tích tài chính",
                image: "https://ssi-one.vercel.app/_next/image?url=%2Fexperts/4.jpg",
              },
              {
                name: "RICHARD SAINTVILUS",
                role: "AI sáng tạo xông vào điện toán đám mây",
                image: "https://ssi-one.vercel.app/_next/image?url=%2Fexperts/5.jpg",
              },
              {
                name: "RICHARD TESLA",
                role: "Tại sao ĐÃ đến lúc Mua Cổ phiếu Tesla",
                image: "https://ssi-one.vercel.app/_next/image?url=%2Fexperts/6.jpg",
              },
            ].map((expert, index) => (
              <motion.div
                key={index}
                className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <img
                  src={expert.image || "/placeholder.svg"}
                  alt={expert.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{expert.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{expert.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* PhosAgro section */}
      <div className="bg-gray-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-6 text-gray-800">Sự kiện đặc biệt</h3>
          <img
            src="https://ssi-one.vercel.app/_next/image?url=%2Fphosagro-anniversary.jpg"
            alt="PhosAgro Anniversary Event"
            className="mx-auto rounded-lg shadow-lg max-w-2xl w-full"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h3 className="text-lg font-bold text-blue-400 uppercase tracking-wider">
              CÔNG TY CỔ PHẦN CHỨNG KHOÁN THÀNH PHỐ HỒ CHÍ MINH
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-semibold mb-3 text-blue-400">Dịch vụ</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Quan hệ đầu tư</li>
                <li className="hover:text-white transition-colors cursor-pointer">Nghề nghiệp</li>
                <li className="hover:text-white transition-colors cursor-pointer">Ứng dụng di động</li>
                <li className="hover:text-white transition-colors cursor-pointer">Trung tâm tin tức</li>
                <li className="hover:text-white transition-colors cursor-pointer">Tiện ích mở rộng Chrome</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-blue-400">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Liên hệ</li>
                <li className="hover:text-white transition-colors cursor-pointer">Báo cáo</li>
                <li className="hover:text-white transition-colors cursor-pointer">Thị trường London</li>
                <li className="hover:text-white transition-colors cursor-pointer">Bản tin thị trường</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-blue-400">Thông tin liên hệ</h4>
              <div className="text-gray-400 space-y-2">
                <p className="flex items-center">
                  <span className="mr-2">🛡️</span>
                  London HSC - Thành Phố Hồ Chí Minh
                </p>
                <p className="flex items-start">
                  <span className="mr-2 mt-1">📍</span>
                  Tầng 5, 6 tòa nhà AB Tower, Số 76 Lê Lai, Phường Bến Thành, Quận 1 TP - HCM
                </p>
                <p className="flex items-start">
                  <span className="mr-2 mt-1">📍</span>
                  18 Paternoster Square, London EC4M 7LS
                </p>
                <p className="flex items-center">
                  <span className="mr-2">🌐</span>
                  MST: 0302190150
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-xs">
            <p>Bản quyền © 2025 London HSC. Mọi quyền được bảo lưu.</p>
            <p className="mt-2">
              <span className="hover:text-white transition-colors cursor-pointer">Điều khoản sử dụng</span>
              {" | "}
              <span className="hover:text-white transition-colors cursor-pointer">Chính sách bảo mật</span>
              {" | "}
              <span className="hover:text-white transition-colors cursor-pointer">Chính sách cookie</span>
            </p>
          </div>
        </div>
      </footer>
    </>
  )
}
