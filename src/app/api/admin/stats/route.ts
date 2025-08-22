import { NextResponse } from 'next/server';
import { getPlatformStats } from '../../../../lib/repositories/users';

// Admin stats API endpoint
export async function GET() {
  try {
    const stats = await getPlatformStats();
    
    return NextResponse.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
}
