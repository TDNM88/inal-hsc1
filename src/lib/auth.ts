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

export async function verifyToken(token: string): Promise<{ userId: string; isValid: boolean }> {
  try {
    const parsed = parseToken(token);
    if (!parsed) {
      return { userId: '', isValid: false };
    }
    
    // Check if token is expired (24 hours)
    const tokenAge = Date.now() - parsed.timestamp;
    const isExpired = tokenAge > 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return {
      userId: parsed.userId,
      isValid: !isExpired
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { userId: '', isValid: false };
  }
}

export async function getUserFromRequest(req: Request): Promise<{ userId: string | null; isAuthenticated: boolean }> {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { userId: null, isAuthenticated: false };
    }

    const token = authHeader.split(' ')[1];
    const { userId, isValid } = await verifyToken(token);
    
    return {
      userId: isValid ? userId : null,
      isAuthenticated: isValid
    };
  } catch (error) {
    console.error('Error getting user from request:', error);
    return { userId: null, isAuthenticated: false };
  }
}
