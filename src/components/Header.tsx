"use client"

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/useAuth"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import {
  UserIcon,
  LogOut,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ChevronDown,
  Phone,
  Menu,
  X,
  Home,
  TrendingUp,
  Newspaper,
  Settings,
  CheckCircle,
} from "lucide-react"

export default function Header() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scrolling effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsMobileMenuOpen(false)
  }

  // Track pathname for route changes
  const pathname = usePathname()

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={`bg-white border-b border-gray-100 sticky top-0 z-50 transition-all duration-200 ${scrolled ? "shadow-md" : "shadow-sm"}`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left side: Logo and Navigation */}
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center mr-6">
            <Image src="/logo.png" alt="London HSC" width={120} height={40} className="h-10 w-auto" priority />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 bg-white hover:bg-blue-50 transition-colors"
              onClick={() => handleNavigation("/")}
            >
              <Home className="h-4 w-4 mr-1" />
              Trang chủ
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 bg-white hover:bg-blue-50 transition-colors"
              onClick={() => handleNavigation("/trade")}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Giao dịch
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-600 border-blue-600 bg-white hover:bg-blue-50 transition-colors"
              onClick={() => handleNavigation("/")}
            >
              <Newspaper className="h-4 w-4 mr-1" />
              Tin tức
            </Button>

            {/* Wallet dropdown for logged in users */}
            {!loading && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-600 bg-white hover:bg-blue-50 transition-colors"
                  >
                    <Wallet className="h-4 w-4 mr-1" />
                    <span>Ví</span>
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={() => handleNavigation("/deposit")} className="cursor-pointer">
                    <ArrowDownLeft className="mr-2 h-4 w-4 text-green-600" />
                    <span>Nạp tiền</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation("/withdraw")} className="cursor-pointer">
                    <ArrowUpRight className="mr-2 h-4 w-4 text-red-600" />
                    <span>Rút tiền</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleNavigation("/deposit-history")} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Lịch sử nạp tiền</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation("/withdraw-history")} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-blue-600" />
                    <span>Lịch sử rút tiền</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation("/orders")} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4 text-purple-600" />
                    <span>Lịch sử giao dịch</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* CSKH button - hidden on mobile */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={() => handleNavigation("/")}
          >
            <Phone className="h-4 w-4 mr-1" />
            CSKH
          </Button>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* User Account dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full overflow-hidden h-8 w-8 hover:ring-2 hover:ring-blue-200 transition-all"
                >
                  <Image
                    src={user.avatar || "/avatars/default.png"}
                    alt={user.username || "User"}
                    width={32}
                    height={32}
                    className="h-full w-full object-cover"
                  />
                </Button>
              ) : (
                <Button variant="outline" size="sm" className="gap-2 hover:bg-blue-50 transition-colors bg-transparent">
                  <UserIcon className="h-4 w-4" />
                  <span>Tài khoản</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {user ? (
                <>
                  {/* Username display */}
                  <div className="px-4 py-2 text-sm font-medium border-b border-gray-100">
                    {user.username || "Người dùng"}
                  </div>

                  <DropdownMenuItem onClick={() => handleNavigation("/account")} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Tổng quan tài khoản</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleNavigation("/account")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Cài đặt bảo mật</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => handleNavigation("/account")} className="cursor-pointer">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    <span>Xác minh danh tính</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => handleNavigation("/login")} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Đăng nhập</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleNavigation("/register")} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Mở tài khoản</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-16 left-0 w-full bg-white z-40 transform transition-transform duration-300 ease-in-out shadow-lg md:hidden ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="border-t border-gray-200">
          <nav className="flex flex-col w-full">
            <button
              onClick={() => handleNavigation("/")}
              className="flex items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors"
            >
              <Home className="h-4 w-4 mr-3" />
              Trang chủ
            </button>
            <button
              onClick={() => handleNavigation("/trade")}
              className="flex items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors"
            >
              <TrendingUp className="h-4 w-4 mr-3" />
              Giao dịch
            </button>

            {user && (
              <>
                <button
                  onClick={() => handleNavigation("/orders")}
                  className="flex items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors"
                >
                  <Clock className="h-4 w-4 mr-3" />
                  Lịch sử giao dịch
                </button>
                <button
                  onClick={() => handleNavigation("/account")}
                  className="flex items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors"
                >
                  <UserIcon className="h-4 w-4 mr-3" />
                  Tổng quan tài khoản
                </button>
                <button
                  onClick={() => handleNavigation("/account")}
                  className="flex items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Cài đặt bảo mật
                </button>
                <button
                  onClick={() => handleNavigation("/account")}
                  className="flex items-center py-3 px-4 border-b border-gray-200 hover:bg-gray-50 text-left transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-3" />
                  Xác minh danh tính
                </button>

                <div className="grid grid-cols-2 gap-4 p-4">
                  <button
                    onClick={() => handleNavigation("/deposit")}
                    className="bg-green-600 text-white py-3 rounded-md flex justify-center items-center font-medium hover:bg-green-700 transition-colors"
                  >
                    <ArrowDownLeft className="h-4 w-4 mr-2" />
                    Nạp tiền
                  </button>
                  <button
                    onClick={() => handleNavigation("/withdraw")}
                    className="bg-red-600 text-white py-3 rounded-md flex justify-center items-center font-medium hover:bg-red-700 transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Rút tiền
                  </button>
                </div>

                <button
                  onClick={handleLogout}
                  className="mx-4 mb-4 bg-white border border-red-300 text-red-600 py-3 rounded-md flex justify-center items-center font-medium hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Đăng xuất
                </button>
              </>
            )}

            {!user && (
              <div className="grid grid-cols-2 gap-4 p-4">
                <button
                  onClick={() => handleNavigation("/login")}
                  className="bg-blue-600 text-white py-3 rounded-md flex justify-center items-center font-medium hover:bg-blue-700 transition-colors"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => handleNavigation("/register")}
                  className="bg-green-600 text-white py-3 rounded-md flex justify-center items-center font-medium hover:bg-green-700 transition-colors"
                >
                  Mở tài khoản
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
