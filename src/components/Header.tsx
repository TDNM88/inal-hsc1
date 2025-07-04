"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { Button } from "./ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { User as UserIcon, LogOut, Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, Clock } from "lucide-react"

export default function Header() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <header className="h-[90px] bg-[#f5f7ff] relative">
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Button
          variant="link"
          onClick={() => router.push("/")}
          className="text-[18px] font-bold text-[#117dbb] p-0 h-auto"
        >
          London HSC
        </Button>
        
        <div className="flex items-center gap-4">
          {!loading && user && (
            <div className="hidden md:block text-gray-600">
              Số dư: <strong className="text-green-600">{user.balance?.toLocaleString() || 0} VND</strong>
            </div>
          )}
          
          {!loading && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Wallet className="h-4 w-4" />
                  <span>Ví</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/deposit")}>
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  <span>Nạp tiền</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/withdraw")}>
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  <span>Rút tiền</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/orders")}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Lịch sử giao dịch</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" className="gap-2">
                  <UserIcon className="h-4 w-4" />
                  {user?.username || 'Tài khoản'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => router.push("/account")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Tài khoản</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/trade")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Giao dịch</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Đăng xuất</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
