"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/useAuth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import useSWR from "swr"
import { Upload, CreditCard, Clock, User } from "lucide-react"

// Hàm lấy cookie
function getCookie(name: string): string {
  if (typeof document === "undefined") return ""
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift() || ""
  return ""
}

export default function DepositPage() {
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBankInfo, setShowBankInfo] = useState(false)
  const [bankInfo, setBankInfo] = useState<any>(null)

  const { data: settings, error: settingsError } = useSWR(
    isAuthenticated() ? "/api/admin/settings" : null,
    async (url) => {
      let authToken = getCookie("token") || ""
      if (!authToken && typeof window !== "undefined") {
        authToken = localStorage.getItem("token") || ""
      }

      if (!authToken) {
        throw new Error("Authentication required")
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          await logout()
          router.push("/login")
          throw new Error("Session expired")
        }
        throw new Error("Failed to load settings")
      }

      return response.json()
    },
  )

  useEffect(() => {
    if (!isAuthenticated()) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng đăng nhập" })
      router.push("/login")
    }
    if (settingsError) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải cài đặt" })
    }
  }, [user, isAuthenticated, router, settingsError, toast])

  const handleSubmit = async () => {
    if (!amount) {
      toast({ variant: "destructive", title: "Lỗi", description: "Vui lòng nhập số tiền" })
      return
    }

    const amountNumber = Number(amount)
    if (amountNumber <= 0) {
      toast({ variant: "destructive", title: "Lỗi", description: "Số tiền phải lớn hơn 0" })
      return
    }

    if (settings && amountNumber < (settings.minDeposit || 0)) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: `Số tiền nạp tối thiểu là ${(settings.minDeposit || 0).toLocaleString()} đ`,
      })
      return
    }

    setIsSubmitting(true)

    try {
      let authToken = getCookie("token") || ""
      if (!authToken && typeof window !== "undefined") {
        authToken = localStorage.getItem("token") || ""
      }

      if (!authToken) {
        throw new Error("Vui lòng đăng nhập lại")
      }

      console.log("Submitting deposit request:", { amount: amountNumber })

      const res = await fetch("/api/deposits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
          Expires: "0",
        },
        credentials: "include",
        body: JSON.stringify({
          amount: amountNumber,
        }),
      })

      console.log("API response status:", res.status)
      const result = await res.json()
      console.log("API response:", result)

      if (res.ok) {
        toast({
          title: "Thành công",
          description: "Yêu cầu nạp tiền đã được gửi thành công!",
        })

        // Hiển thị thông tin ngân hàng
        if (result.bankInfo) {
          setBankInfo(result.bankInfo)
          setShowBankInfo(true)
        }

        setAmount("")
      } else {
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: result.message || "Có lỗi xảy ra khi gửi yêu cầu",
        })
      }
    } catch (err) {
      console.error("Submit error:", err)
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể gửi yêu cầu. Vui lòng thử lại sau.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Vui lòng đăng nhập để tiếp tục</div>
      </div>
    )
  }

  return (
    <div id="deposit-page" className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* User Info Card */}
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-700 p-6">
            <CardTitle className="text-xl font-semibold text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Tên đăng nhập:</span>
                <p className="text-white font-medium">{user?.username}</p>
              </div>
              <div>
                <span className="text-gray-400">Số dư hiện tại:</span>
                <p className="text-green-400 font-medium">{user?.balance?.toLocaleString() || 0} đ</p>
              </div>
              <div>
                <span className="text-gray-400">Họ tên:</span>
                <p className="text-white font-medium">{user?.fullName || "Chưa cập nhật"}</p>
              </div>
              <div>
                <span className="text-gray-400">Số điện thoại:</span>
                <p className="text-white font-medium">{user?.phone || "Chưa cập nhật"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deposit Form */}
        <Card className="bg-gray-800 border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="border-b border-gray-700 p-6">
            <CardTitle className="text-2xl font-semibold text-white flex items-center">
              <CreditCard className="h-6 w-6 mr-2" />
              Nạp tiền vào tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label className="text-gray-400 text-sm font-medium">Số tiền nạp (VND)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Nhập số tiền cần nạp"
                className="bg-gray-700 text-white border-gray-600 focus:border-blue-500 mt-2"
                min="0"
                step="1000"
              />
              {settings && (
                <p className="text-sm text-gray-500 mt-2">
                  Số tiền nạp tối thiểu: {(settings.minDeposit || 0).toLocaleString()} đ
                </p>
              )}
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="text-white font-medium mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Lưu ý quan trọng
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Sau khi gửi yêu cầu, bạn sẽ nhận được thông tin chuyển khoản</li>
                <li>• Vui lòng chuyển khoản đúng số tiền và nội dung được cung cấp</li>
                <li>• Thời gian xử lý: 5-15 phút trong giờ hành chính</li>
                <li>• Liên hệ CSKH nếu có vấn đề về giao dịch</li>
              </ul>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={!amount || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Gửi yêu cầu nạp tiền
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bank Info Modal */}
      {showBankInfo && bankInfo && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-4 text-center">Thông tin chuyển khoản</h3>
            <div className="space-y-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ngân hàng:</span>
                    <span className="text-white font-medium">{bankInfo.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tài khoản:</span>
                    <span className="text-white font-medium">{bankInfo.accountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chủ tài khoản:</span>
                    <span className="text-white font-medium">{bankInfo.accountName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Số tiền:</span>
                    <span className="text-green-400 font-bold">{Number(amount).toLocaleString()} đ</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                <p className="text-yellow-400 text-sm text-center">
                  Vui lòng chuyển khoản đúng số tiền và ghi rõ tên đăng nhập trong nội dung chuyển khoản
                </p>
              </div>
            </div>

            <Button
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setShowBankInfo(false)}
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
