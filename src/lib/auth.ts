import bcrypt from "bcryptjs"

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId: string): string {
  return `user_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function parseToken(token: string): { userId: string; timestamp: number } | null {
  const parts = token.split("_")
  if (parts.length >= 3 && parts[0] === "user") {
    return {
      userId: parts[1],
      timestamp: Number.parseInt(parts[2]),
    }
  }
  return null
}
