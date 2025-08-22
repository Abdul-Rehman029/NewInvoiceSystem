import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getCustomers, createCustomer } from '@/lib/repositories/customers';
import { z } from 'zod';

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional(),
  address: z.string().min(1, 'Address is required'),
  ntn: z.string().min(7, 'NTN/CNIC must be at least 7 characters').max(13, 'NTN/CNIC cannot exceed 13 characters'),
  province: z.string().min(1, 'Province is required'),
  status: z.enum(['Filer', 'Non-Filer']),
});

// Get all customers for authenticated user
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

    const customers = await getCustomers(authUser.id);
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Get customers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new customer
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const authUser = await validateSession(token);
    if (!authUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const customerData = createCustomerSchema.parse(body);

    const customerId = await createCustomer({
      ...customerData,
      email: customerData.email || '',
      userId: authUser.id
    });

    return NextResponse.json({ success: true, customerId }, { status: 201 });
  } catch (error) {
    console.error('Create customer API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
