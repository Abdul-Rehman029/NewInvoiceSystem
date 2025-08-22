import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers } from '../../../../lib/repositories/users';

export async function GET(request: NextRequest) {
  try {
    const users = await getAllUsers();
    
    return NextResponse.json({
      success: true,
      users: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
