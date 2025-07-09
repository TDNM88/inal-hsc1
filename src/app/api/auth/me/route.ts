import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/db"
import { parseToken } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    // Lấy token từ cookie hoặc Authorization header
    const cookies = request.headers.get("cookie") || ""
    const tokenMatch = cookies.match(/token=([^;]+)/)
    let token = tokenMatch ? tokenMatch[1] : null

    if (!token) {
      // Nếu không có token ở cookie, thử lấy ở Authorization header
      const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7)
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, message: "Chưa đăng nhập" }, { status: 401 })
    }

    const tokenData = parseToken(token)
    if (!tokenData) {
      return NextResponse.json({ success: false, message: "Token không hợp lệ" }, { status: 401 })
    }

    // Check token expiry (7 days)
    const now = Date.now()
    const tokenAge = now - tokenData.timestamp
    const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    if (tokenAge > maxAge) {
      return NextResponse.json({ success: false, message: "Token đã hết hạn" }, { status: 401 })
    }

    // Get user from database
    const db = await getMongoDb()
    if (!db) {
      throw new Error("Không thể kết nối cơ sở dữ liệu")
    }

    const userDoc = await db.collection("users").findOne(
      { _id: new ObjectId(tokenData.userId) }
    )

    if (!userDoc) {
      return NextResponse.json({ 
        success: false, 
        message: "Người dùng không tồn tại",
        _debug: process.env.NODE_ENV !== 'production' ? {
          userId: tokenData.userId,
          error: 'user_not_found'
        } : undefined
      }, { status: 404 })
    }

    // Chỉ trả về các trường cần thiết
    const userResponse = {
      id: userDoc._id.toString(),
      username: userDoc.username,
      role: userDoc.role || "user",
      balance: userDoc.balance || { available: 0, frozen: 0 },
      bank: userDoc.bank || { name: "", accountNumber: "", accountHolder: "" },
      verification: userDoc.verification || { verified: false, cccdFront: "", cccdBack: "" },
      status: userDoc.status || { active: true, betLocked: false, withdrawLocked: false },
      createdAt: userDoc.createdAt,
      lastLogin: userDoc.lastLogin,
    }

    // Kiểm tra trạng thái tài khoản
    if (userResponse.status && !userResponse.status.active) {
      return NextResponse.json({ success: false, message: "Tài khoản đã bị khóa" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
    })
  } catch (error) {
    console.error("Auth me error:", error)
    return NextResponse.json({ success: false, message: "Lỗi hệ thống" }, { status: 500 })
  }
}
