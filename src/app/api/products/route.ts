import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { getProducts, createProduct } from '@/lib/repositories/products';
import { z } from 'zod';

const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Unit price must be non-negative'),
  hsCode: z.string().min(1, 'HS Code is required'),
  rate: z.string().min(1, 'Rate is required'),
  uoM: z.string().min(1, 'UoM is required'),
});

// Get all products for authenticated user
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

    const products = await getProducts(authUser.id);
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Get products API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new product
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
    const productData = createProductSchema.parse(body);

    const productId = await createProduct({
      ...productData,
      description: productData.description || '',
      userId: authUser.id
    });

    return NextResponse.json({ success: true, productId }, { status: 201 });
  } catch (error) {
    console.error('Create product API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
