
export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  hsCode: string;
  rate: string;
  uoM: string;
  saleType: string;
}

export interface InvoiceParty {
  name: string;
  address: string;
  email?: string;
  ntn: string;
  province: string;
}

export interface Invoice {
  id: string;
  userId: string;
  customerName: string; // From buyer.name for easy access
  issueDate: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  amount: number;
  lineItems: LineItem[];
  seller: InvoiceParty;
  buyer: InvoiceParty;
  notes?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  registrationDate: string;
  invoiceCount: number;
  lastLogin: string;
  paidAmount?: number;
  pendingAmount?: number;
}

export interface Customer {
    id: string;
    userId: string;
    name: string;
    email: string;
    address: string;
    ntn: string;
    province: string;
    status: 'Filer' | 'Non-Filer';
}

export interface Product {
    id: string;
    userId: string;
    name: string;
    description: string;
    unitPrice: number;
    hsCode: string;
    rate: string;
    uoM: string;
}
