import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getInvoices } from '@/lib/repositories/invoices';

// Get invoices for authenticated user
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await validateSession(token);
    if (!authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as 'Paid' | 'Pending' | 'Overdue' | null;

    const filters: { userId: string; status?: 'Paid' | 'Pending' | 'Overdue' } = { userId: authUser.id };
    if (status) filters.status = status;

    const result = await getInvoices(filters, page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Get invoices API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
