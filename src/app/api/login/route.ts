import { NextResponse } from "next/server"
import { getMongoDb } from "@/lib/db"
import { comparePassword, generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, message: "Vui lòng nhập đủ thông tin" }, { status: 400 })
    }

    const db = await getMongoDb()
    if (!db) {
      throw new Error("Không thể kết nối cơ sở dữ liệu")
    }

    const user = await db.collection("users").findOne({
      username: username.trim().toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ success: false, message: "Sai tài khoản hoặc mật khẩu" }, { status: 401 })
    }

    // Check if user is active
    if (!user.status?.active) {
      return NextResponse.json({ success: false, message: "Tài khoản đã bị khóa" }, { status: 401 })
    }

    const validPassword = await comparePassword(password, user.password)
    if (!validPassword) {
      return NextResponse.json({ success: false, message: "Sai tài khoản hoặc mật khẩu" }, { status: 401 })
    }

    // Update last login
    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          lastLogin: new Date(),
          updatedAt: new Date(),
        },
      },
    )

    // Generate token
    const token = generateToken(user._id.toString())

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: user.role || "user",
        balance: user.balance || { available: 0, frozen: 0 },
      },
    })

    // Set cookie with development-friendly settings
    const isProduction = process.env.NODE_ENV === 'production';
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: isProduction ? "lax" : "lax",
      // In development, don't set domain to allow localhost cookies to work
      domain: isProduction ? ".yourdomain.com" : undefined
    });
    
    // For debugging
    console.log('Login successful, token set:', token.substring(0, 10) + '...');

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ success: false, message: "Lỗi hệ thống" }, { status: 500 })
  }
}
