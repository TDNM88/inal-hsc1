import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const db = await getMongoDb();
    if (!db) {
      throw new Error('Could not connect to database');
    }

    // Get total count for pagination
    const total = await db.collection('admin_trades').countDocuments();
    
    // Get paginated results
    const sessions = await db
      .collection('admin_trades')
      .find()
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: sessions,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });

  } catch (error) {
    console.error('Error fetching trading sessions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId, result, startTime, endTime } = body;

    if (!sessionId || !result || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    if (!db) {
      throw new Error('Could not connect to database');
    }

    // Check if session already exists
    const existingSession = await db.collection('admin_trades').findOne({ sessionId });
    
    if (existingSession) {
      // Update existing session
      await db.collection('admin_trades').updateOne(
        { sessionId },
        { 
          $set: { 
            result,
            endTime: new Date(endTime),
            updatedAt: new Date()
          } 
        }
      );
    } else {
      // Create new session
      await db.collection('admin_trades').insertOne({
        sessionId,
        result,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Trading session saved successfully'
    });

  } catch (error) {
    console.error('Error saving trading session:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
