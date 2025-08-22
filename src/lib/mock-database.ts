import type { User, Customer, Product, Invoice, LineItem } from './types';

// Mock data for development and testing - Updated for Vercel deployment
const mockUsers: User[] = [
  {
    id: 'admin-001',
    name: 'System Administrator',
    email: 'admin@fbr.gov.pk',
    role: 'admin',
    registrationDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date().toISOString(),
    invoiceCount: 0,
    paidAmount: 0,
    pendingAmount: 0
  },
  {
    id: 'user-001',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'user',
    registrationDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    invoiceCount: 5,
    paidAmount: 150000,
    pendingAmount: 25000
  },
  {
    id: 'user-002',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'user',
    registrationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    invoiceCount: 3,
    paidAmount: 75000,
    pendingAmount: 15000
  }
];

const mockCustomers: Customer[] = [
  {
    id: 'customer-001',
    userId: 'user-001',
    name: 'ABC Corporation',
    email: 'accounts@abccorp.com',
    address: '123 Business Street, Karachi, Pakistan',
    ntn: '1234567-8',
    province: 'Sindh',
    status: 'Filer',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'customer-002',
    userId: 'user-001',
    name: 'XYZ Enterprises',
    email: 'info@xyzenterprises.com',
    address: '456 Commerce Road, Lahore, Pakistan',
    ntn: '8765432-1',
    province: 'Punjab',
    status: 'Non-Filer',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'customer-003',
    userId: 'user-002',
    name: 'Tech Solutions Ltd',
    email: 'admin@techsolutions.pk',
    address: '789 Innovation Drive, Islamabad, Pakistan',
    ntn: '1122334-5',
    province: 'Federal',
    status: 'Filer',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockProducts: Product[] = [
  {
    id: 'product-001',
    userId: 'user-001',
    name: 'Laptop Computer',
    description: 'High-performance laptop for business use',
    unitPrice: 150000,
    hsCode: '8471.30.00',
    rate: '17%',
    uoM: 'PCS',
    createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'product-002',
    userId: 'user-001',
    name: 'Office Chair',
    description: 'Ergonomic office chair with adjustable features',
    unitPrice: 25000,
    hsCode: '9401.30.00',
    rate: '17%',
    uoM: 'PCS',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'product-003',
    userId: 'user-002',
    name: 'Software License',
    description: 'Annual software license for business applications',
    unitPrice: 50000,
    hsCode: '8523.40.00',
    rate: '17%',
    uoM: 'LIC',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'INV-2024-001',
    userId: 'user-001',
    customerName: 'ABC Corporation',
    issueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    amount: 175000,
    notes: 'Payment due within 30 days',
    seller: {
      name: 'John Doe Trading Co.',
      address: '123 Business Street, Karachi, Pakistan',
      email: 'john.doe@example.com',
      ntn: '1234567-8',
      province: 'Sindh'
    },
    buyer: {
      name: 'ABC Corporation',
      address: '123 Business Street, Karachi, Pakistan',
      email: 'accounts@abccorp.com',
      ntn: '1234567-8',
      province: 'Sindh'
    },
    lineItems: [
      {
        description: 'Laptop Computer',
        quantity: 1,
        unitPrice: 150000,
        total: 150000,
        hsCode: '8471.30.00',
        rate: '17%',
        uoM: 'PCS',
        saleType: 'Local Supply'
      },
      {
        description: 'Office Chair',
        quantity: 1,
        unitPrice: 25000,
        total: 25000,
        hsCode: '9401.30.00',
        rate: '17%',
        uoM: 'PCS',
        saleType: 'Local Supply'
      }
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'INV-2024-002',
    userId: 'user-002',
    customerName: 'Tech Solutions Ltd',
    issueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Paid',
    amount: 50000,
    notes: 'Payment received',
    seller: {
      name: 'Jane Smith Services',
      address: '456 Commerce Road, Lahore, Pakistan',
      email: 'jane.smith@example.com',
      ntn: '8765432-1',
      province: 'Punjab'
    },
    buyer: {
      name: 'Tech Solutions Ltd',
      address: '789 Innovation Drive, Islamabad, Pakistan',
      email: 'admin@techsolutions.pk',
      ntn: '1122334-5',
      province: 'Federal'
    },
    lineItems: [
      {
        description: 'Software License',
        quantity: 1,
        unitPrice: 50000,
        total: 50000,
        hsCode: '8523.40.00',
        rate: '17%',
        uoM: 'LIC',
        saleType: 'Local Supply'
      }
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockSessions: { [token: string]: { userId: string; expiresAt: Date } } = {};

// Mock execute query function
export async function mockExecuteQuery<T>(query: string, parameters: { [key: string]: unknown } = {}): Promise<{ recordset: T[] }> {
  // Simulate database query execution
  console.log('Mock query:', query);
  console.log('Mock parameters:', parameters);
  
  // Return empty result set for now
  return { recordset: [] as T[] };
}

// Mock execute procedure function
export async function mockExecuteProcedure<T>(procedureName: string, _parameters: { [key: string]: unknown } = {}): Promise<{ recordset: T[] }> {
  // Simulate stored procedure execution
  console.log('Mock procedure:', procedureName);
  
  // Return empty result set for now
  return { recordset: [] as T[] };
}

// Mock connection pool
export const mockPool = {
  request: () => ({
    input: (name: string, value: unknown) => ({}),
    query: async (query: string) => ({ recordset: [] }),
    execute: async (procedure: string) => ({ recordset: [] })
  }),
  close: async () => {}
};
