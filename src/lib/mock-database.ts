import type { User, Customer, Product, Invoice, LineItem } from './types';

// Mock data storage with test data
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@fbr.gov.pk',
    role: 'admin',
    registrationDate: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    invoiceCount: 5,
    paidAmount: 150000,
    pendingAmount: 75000
  },
  {
    id: '2',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
    registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
    invoiceCount: 3,
    paidAmount: 85000,
    pendingAmount: 45000
  },
  {
    id: '3',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    registrationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
    invoiceCount: 2,
    paidAmount: 60000,
    pendingAmount: 30000
  }
];

const mockCustomers: Customer[] = [
  {
    id: 'customer_1',
    userId: '1',
    name: 'ABC Textiles Ltd',
    email: 'accounts@abctextiles.com',
    address: '123 Industrial Area, Karachi',
    ntn: '1234567-8',
    province: 'Sindh',
    status: 'Registered',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'customer_2',
    userId: '1',
    name: 'XYZ Garments',
    email: 'billing@xyzgarments.com',
    address: '456 Export Zone, Lahore',
    ntn: '2345678-9',
    province: 'Punjab',
    status: 'Registered',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'customer_3',
    userId: '1',
    name: 'Pak Fabrics',
    email: 'info@pakfabrics.com',
    address: '789 Textile Street, Faisalabad',
    ntn: '3456789-0',
    province: 'Punjab',
    status: 'Registered',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockProducts: Product[] = [
  {
    id: 'product_1',
    userId: '1',
    name: 'Premium Cotton Fabric',
    description: 'High-quality cotton fabric for premium garments',
    unitPrice: 2500,
    hsCode: '5208.52',
    rate: '18%',
    uoM: 'meters',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'product_2',
    userId: '1',
    name: 'Polyester Blend',
    description: 'Durable polyester blend fabric',
    unitPrice: 1800,
    hsCode: '5513.11',
    rate: '18%',
    uoM: 'meters',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'product_3',
    userId: '1',
    name: 'Silk Fabric',
    description: 'Luxury silk fabric for high-end garments',
    unitPrice: 8500,
    hsCode: '5007.20',
    rate: '18%',
    uoM: 'meters',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'product_4',
    userId: '1',
    name: 'Denim Fabric',
    description: 'Heavy-duty denim for jeans and jackets',
    unitPrice: 3200,
    hsCode: '5209.42',
    rate: '18%',
    uoM: 'meters',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    userId: '1',
    customerName: 'ABC Textiles Ltd',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    status: 'Paid',
    amount: 45000,
    seller: {
      name: 'Pak Textile Solutions',
      address: '123 Textile Ave, Faisalabad',
      email: 'billing@paktextile.com',
      ntn: '1234567-8',
      province: 'Punjab'
    },
    buyer: {
      name: 'ABC Textiles Ltd',
      address: '123 Industrial Area, Karachi',
      email: 'accounts@abctextiles.com',
      ntn: '1234567-8',
      province: 'Sindh'
    },
    lineItems: [
      {
        description: 'Premium Cotton Fabric',
        quantity: 15,
        unitPrice: 2500,
        total: 37500,
        hsCode: '5208.52',
        rate: '18%',
        uoM: 'meters',
        saleType: 'Goods at standard rate'
      },
      {
        description: 'Polyester Blend',
        quantity: 5,
        unitPrice: 1800,
        total: 9000,
        hsCode: '5513.11',
        rate: '18%',
        uoM: 'meters',
        saleType: 'Goods at standard rate'
      }
    ],
    notes: 'Thank you for your business!',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'INV-2024-002',
    userId: '1',
    customerName: 'XYZ Garments',
    issueDate: '2024-01-20',
    dueDate: '2024-02-20',
    status: 'Pending',
    amount: 68000,
    seller: {
      name: 'Pak Textile Solutions',
      address: '123 Textile Ave, Faisalabad',
      email: 'billing@paktextile.com',
      ntn: '1234567-8',
      province: 'Punjab'
    },
    buyer: {
      name: 'XYZ Garments',
      address: '456 Export Zone, Lahore',
      email: 'billing@xyzgarments.com',
      ntn: '2345678-9',
      province: 'Punjab'
    },
    lineItems: [
      {
        description: 'Silk Fabric',
        quantity: 8,
        unitPrice: 8500,
        total: 68000,
        hsCode: '5007.20',
        rate: '18%',
        uoM: 'meters',
        saleType: 'Goods at standard rate'
      }
    ],
    notes: 'Premium quality silk fabric',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'INV-2024-003',
    userId: '1',
    customerName: 'Pak Fabrics',
    issueDate: '2024-02-01',
    dueDate: '2024-03-01',
    status: 'Overdue',
    amount: 32000,
    seller: {
      name: 'Pak Textile Solutions',
      address: '123 Textile Ave, Faisalabad',
      email: 'billing@paktextile.com',
      ntn: '1234567-8',
      province: 'Punjab'
    },
    buyer: {
      name: 'Pak Fabrics',
      address: '789 Textile Street, Faisalabad',
      email: 'info@pakfabrics.com',
      ntn: '3456789-0',
      province: 'Punjab'
    },
    lineItems: [
      {
        description: 'Denim Fabric',
        quantity: 10,
        unitPrice: 3200,
        total: 32000,
        hsCode: '5209.42',
        rate: '18%',
        uoM: 'meters',
        saleType: 'Goods at standard rate'
      }
    ],
    notes: 'Heavy-duty denim for industrial use',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockSessions: { [token: string]: { userId: string; expiresAt: Date } } = {};

// Optimized mock database functions (no artificial delays)
export async function mockExecuteQuery<T>(query: string, parameters: { [key: string]: unknown } = {}): Promise<{ recordset: T[] }> {
  // Remove artificial delay for better performance
  // await new Promise(resolve => setTimeout(resolve, 100));

  if (query.includes('SELECT') && query.includes('Users') && query.includes('Email')) {
    const email = parameters.email as string;
    const user = mockUsers.find(u => u.email === email);
    return { recordset: user ? [user as T] : [] };
  }

  if (query.includes('SELECT') && query.includes('Users')) {
    return { recordset: mockUsers as T[] };
  }

  if (query.includes('SELECT') && query.includes('Customers')) {
    const userId = parameters.userId as string;
    if (userId) {
      const userCustomers = mockCustomers.filter(c => c.userId === userId);
      return { recordset: userCustomers as T[] };
    }
    return { recordset: mockCustomers as T[] };
  }

  if (query.includes('SELECT') && query.includes('Products')) {
    const userId = parameters.userId as string;
    if (userId) {
      const userProducts = mockProducts.filter(p => p.userId === userId);
      return { recordset: userProducts as T[] };
    }
    return { recordset: mockProducts as T[] };
  }

  if (query.includes('SELECT') && query.includes('Invoices')) {
    const userId = parameters.userId as string;
    if (userId) {
      const userInvoices = mockInvoices.filter(i => i.userId === userId);
      return { recordset: userInvoices as T[] };
    }
    return { recordset: mockInvoices as T[] };
  }

  if (query.includes('SELECT') && query.includes('Sessions')) {
    const token = parameters.token as string;
    const session = mockSessions[token];
    return { recordset: session ? [{ userId: session.userId, expiresAt: session.expiresAt } as T] : [] };
  }

  if (query.includes('INSERT') && query.includes('Users')) {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: parameters.name as string,
      email: parameters.email as string,
      role: parameters.role as 'admin' | 'user',
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      invoiceCount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };
    mockUsers.push(newUser);
    return { recordset: [{ Id: newUser.id } as T] };
  }

  if (query.includes('INSERT') && query.includes('Sessions')) {
    const token = parameters.token as string;
    mockSessions[token] = {
      userId: parameters.userId as string,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
    return { recordset: [] };
  }

  if (query.includes('INSERT') && query.includes('Customers')) {
    const newCustomer: Customer = {
      id: `customer_${Date.now()}`,
      userId: parameters.userId as string,
      name: parameters.name as string,
      email: parameters.email as string || '',
      address: parameters.address as string,
      ntn: parameters.ntn as string,
      province: parameters.province as string,
      status: parameters.status as 'Registered' | 'Unregistered',
      createdAt: new Date().toISOString()
    };
    mockCustomers.push(newCustomer);
    return { recordset: [] };
  }

  if (query.includes('INSERT') && query.includes('Products')) {
    const newProduct: Product = {
      id: `product_${Date.now()}`,
      userId: parameters.userId as string,
      name: parameters.name as string,
      description: parameters.description as string || '',
      unitPrice: parameters.unitPrice as number,
      hsCode: parameters.hsCode as string,
      rate: parameters.rate as string,
      uoM: parameters.uoM as string,
      createdAt: new Date().toISOString()
    };
    mockProducts.push(newProduct);
    return { recordset: [] };
  }

  if (query.includes('INSERT') && query.includes('Invoices')) {
    const newInvoice: Invoice = {
      id: parameters.id as string,
      userId: parameters.userId as string,
      customerName: parameters.customerName as string,
      issueDate: parameters.issueDate as string,
      dueDate: parameters.dueDate as string,
      status: parameters.status as 'Paid' | 'Pending' | 'Overdue',
      amount: parameters.amount as number,
      seller: parameters.seller as any,
      buyer: parameters.buyer as any,
      lineItems: parameters.lineItems as LineItem[],
      notes: parameters.notes as string || '',
      createdAt: new Date().toISOString()
    };
    mockInvoices.push(newInvoice);
    return { recordset: [] };
  }

  if (query.includes('UPDATE') && query.includes('Users')) {
    const userId = parameters.userId as string;
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      user.lastLogin = new Date().toISOString();
    }
    return { recordset: [] };
  }

  if (query.includes('DELETE') && query.includes('Sessions')) {
    const token = parameters.token as string;
    delete mockSessions[token];
    return { recordset: [] };
  }

  return { recordset: [] };
}

export async function mockExecuteProcedure<T>(procedureName: string, parameters: { [key: string]: unknown } = {}): Promise<{ recordset: T[] }> {
  // Remove artificial delay for better performance
  // await new Promise(resolve => setTimeout(resolve, 100));
  return { recordset: [] };
}

// Mock connection pool
export const mockPool = {
  connect: async () => ({ close: () => {} }),
  close: async () => {}
};
