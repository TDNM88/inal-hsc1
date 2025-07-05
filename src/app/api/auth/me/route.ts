import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

interface UserData {
  _id: ObjectId;
  username: string;
  email: string;
  role?: string;
  fullName?: string;
  balance?: { available: number; frozen: number };
  bank?: any;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify the token and get user ID
    const decoded = verifyToken(token);
    if (!decoded || typeof decoded !== 'object' || !('id' in decoded)) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const userId = (decoded as { id: string }).id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid user ID in token' },
        { status: 401 }
      );
    }

    // Get user from database
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Database connection error' },
        { status: 500 }
      );
    }

    let user: UserData | null;
    try {
      user = await db.collection<UserData>('users').findOne(
        { _id: new ObjectId(userId) },
        { projection: { password: 0 } } // Exclude password
      ) as UserData | null;
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Error fetching user data' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }



    // Return user data without sensitive information
    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      isAdmin: user.role === 'admin',
      fullName: user.fullName || '',
      balance: user.balance || { available: 0, frozen: 0 },
      bank: user.bank || null
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
