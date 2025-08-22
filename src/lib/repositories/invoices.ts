import { executeQuery } from '../database';
import type { Invoice } from '../types';
import sql from 'mssql';

export interface InvoiceFilters {
  userId?: string;
  status?: 'Paid' | 'Pending' | 'Overdue';
  fromDate?: string;
  toDate?: string;
  customerId?: string;
}

export interface PaginatedInvoices {
  invoices: Invoice[];
  total: number;
  hasMore: boolean;
}

// Create invoice with line items
export async function createInvoice(invoice: Omit<Invoice, 'id'> & { id: string }): Promise<string> {
  try {
    // Insert invoice
    await executeQuery(`
      INSERT INTO Invoices (
        Id, UserId, CustomerName, IssueDate, DueDate, Status, Amount, Notes,
        SellerName, SellerAddress, SellerEmail, SellerNTN, SellerProvince,
        BuyerName, BuyerAddress, BuyerEmail, BuyerNTN, BuyerProvince
      ) VALUES (
        @Id, @UserId, @CustomerName, @IssueDate, @DueDate, @Status, @Amount, @Notes,
        @SellerName, @SellerAddress, @SellerEmail, @SellerNTN, @SellerProvince,
        @BuyerName, @BuyerAddress, @BuyerEmail, @BuyerNTN, @BuyerProvince
      )
    `, {
      Id: invoice.id,
      UserId: invoice.userId,
      CustomerName: invoice.customerName,
      IssueDate: invoice.issueDate,
      DueDate: invoice.dueDate,
      Status: invoice.status,
      Amount: invoice.amount,
      Notes: invoice.notes,
      SellerName: invoice.seller.name,
      SellerAddress: invoice.seller.address,
      SellerEmail: invoice.seller.email,
      SellerNTN: invoice.seller.ntn,
      SellerProvince: invoice.seller.province,
      BuyerName: invoice.buyer.name,
      BuyerAddress: invoice.buyer.address,
      BuyerEmail: invoice.buyer.email,
      BuyerNTN: invoice.buyer.ntn,
      BuyerProvince: invoice.buyer.province
    });

    // Insert line items
    for (const item of invoice.lineItems) {
      await executeQuery(`
        INSERT INTO InvoiceLineItems (
          InvoiceId, Description, Quantity, UnitPrice, Total, HSCode, Rate, UoM, SaleType
        ) VALUES (
          @InvoiceId, @Description, @Quantity, @UnitPrice, @Total, @HSCode, @Rate, @UoM, @SaleType
        )
      `, {
        InvoiceId: invoice.id,
        Description: item.description,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        Total: item.total,
        HSCode: item.hsCode,
        Rate: item.rate,
        UoM: item.uoM,
        SaleType: item.saleType
      });
    }

    return invoice.id;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
}

// Get invoices with pagination and filters
export async function getInvoices(
  filters: InvoiceFilters = {},
  page: number = 1,
  limit: number = 10
): Promise<PaginatedInvoices> {
  try {
    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const parameters: { [key: string]: unknown } = {};

    // Build where clause based on filters
    if (filters.userId) {
      whereClause += ' AND i.UserId = @userId';
      parameters.userId = filters.userId;
    }

    if (filters.status) {
      whereClause += ' AND i.Status = @status';
      parameters.status = filters.status;
    }

    if (filters.fromDate) {
      whereClause += ' AND i.IssueDate >= @fromDate';
      parameters.fromDate = filters.fromDate;
    }

    if (filters.toDate) {
      whereClause += ' AND i.IssueDate <= @toDate';
      parameters.toDate = filters.toDate;
    }

    // Get total count
    const countResult = await executeQuery<{ Total: number }>(
      `SELECT COUNT(*) as Total FROM Invoices i WHERE ${whereClause}`,
      parameters
    );
    const total = countResult.recordset[0].Total;

    // Get invoices with line items
    const invoicesResult = await executeQuery<{
      Id: string;
      UserId: string;
      CustomerName: string;
      IssueDate: Date;
      DueDate: Date;
      Status: string;
      Amount: number;
      Notes: string;
      SellerName: string;
      SellerAddress: string;
      SellerEmail: string;
      SellerNTN: string;
      SellerProvince: string;
      BuyerName: string;
      BuyerAddress: string;
      BuyerEmail: string;
      BuyerNTN: string;
      BuyerProvince: string;
      CreatedAt: Date;
      UpdatedAt: Date;
      LineItemId: string | null;
      LineItemDescription: string | null;
      Quantity: number | null;
      UnitPrice: number | null;
      LineItemTotal: number | null;
      HSCode: string | null;
      Rate: string | null;
      UoM: string | null;
      SaleType: string | null;
    }>(
      `SELECT 
         i.Id, i.UserId, i.CustomerName, i.IssueDate, i.DueDate, i.Status, i.Amount, i.Notes,
         i.SellerName, i.SellerAddress, i.SellerEmail, i.SellerNTN, i.SellerProvince,
         i.BuyerName, i.BuyerAddress, i.BuyerEmail, i.BuyerNTN, i.BuyerProvince,
         i.CreatedAt, i.UpdatedAt,
         li.Id as LineItemId, li.Description as LineItemDescription, li.Quantity, li.UnitPrice, 
         li.Total as LineItemTotal, li.HSCode, li.Rate, li.UoM, li.SaleType
       FROM Invoices i
       LEFT JOIN InvoiceLineItems li ON i.Id = li.InvoiceId
       WHERE ${whereClause}
       ORDER BY i.CreatedAt DESC
       OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      { ...parameters, offset, limit }
    );

    // Group line items by invoice
    const invoiceMap = new Map<string, Invoice>();

    invoicesResult.recordset.forEach(row => {
      if (!invoiceMap.has(row.Id)) {
        invoiceMap.set(row.Id, {
          id: row.Id,
          userId: row.UserId,
          customerName: row.CustomerName,
          issueDate: row.IssueDate.toISOString(),
          dueDate: row.DueDate.toISOString(),
          status: row.Status as 'Paid' | 'Pending' | 'Overdue',
          amount: row.Amount,
          notes: row.Notes,
          seller: {
            name: row.SellerName,
            address: row.SellerAddress,
            email: row.SellerEmail,
            ntn: row.SellerNTN,
            province: row.SellerProvince
          },
          buyer: {
            name: row.BuyerName,
            address: row.BuyerAddress,
            email: row.BuyerEmail,
            ntn: row.BuyerNTN,
            province: row.BuyerProvince
          },
          lineItems: []
        });
      }

      // Add line item if exists
      if (row.LineItemId) {
        const invoice = invoiceMap.get(row.Id)!;
        invoice.lineItems.push({
          description: row.LineItemDescription || '',
          quantity: row.Quantity || 0,
          unitPrice: row.UnitPrice || 0,
          total: row.LineItemTotal || 0,
          hsCode: row.HSCode || '',
          rate: row.Rate || '',
          uoM: row.UoM || '',
          saleType: row.SaleType || ''
        });
      }
    });

    const invoices = Array.from(invoiceMap.values());
    const hasMore = offset + limit < total;

    return { invoices, total, hasMore };
  } catch (error) {
    console.error('Get invoices error:', error);
    throw error;
  }
}

// Get invoice by ID
export async function getInvoiceById(invoiceId: string, userId?: string): Promise<Invoice | null> {
  try {
    let whereClause = 'i.Id = @invoiceId';
    const parameters: { [key: string]: unknown } = { invoiceId };

    if (userId) {
      whereClause += ' AND i.UserId = @userId';
      parameters.userId = userId;
    }

    const result = await executeQuery<{
      Id: string;
      UserId: string;
      CustomerName: string;
      IssueDate: Date;
      DueDate: Date;
      Status: string;
      Amount: number;
      Notes: string;
      SellerName: string;
      SellerAddress: string;
      SellerEmail: string;
      SellerNTN: string;
      SellerProvince: string;
      BuyerName: string;
      BuyerAddress: string;
      BuyerEmail: string;
      BuyerNTN: string;
      BuyerProvince: string;
      LineItemId: string | null;
      LineItemDescription: string | null;
      Quantity: number | null;
      UnitPrice: number | null;
      LineItemTotal: number | null;
      HSCode: string | null;
      Rate: string | null;
      UoM: string | null;
      SaleType: string | null;
    }>(
      `SELECT 
         i.Id, i.UserId, i.CustomerName, i.IssueDate, i.DueDate, i.Status, i.Amount, i.Notes,
         i.SellerName, i.SellerAddress, i.SellerEmail, i.SellerNTN, i.SellerProvince,
         i.BuyerName, i.BuyerAddress, i.BuyerEmail, i.BuyerNTN, i.BuyerProvince,
         li.Id as LineItemId, li.Description as LineItemDescription, li.Quantity, li.UnitPrice, 
         li.Total as LineItemTotal, li.HSCode, li.Rate, li.UoM, li.SaleType
       FROM Invoices i
       LEFT JOIN InvoiceLineItems li ON i.Id = li.InvoiceId
       WHERE ${whereClause}`,
      parameters
    );

    if (result.recordset.length === 0) {
      return null;
    }

    const firstRow = result.recordset[0];
    const invoice: Invoice = {
      id: firstRow.Id,
      userId: firstRow.UserId,
      customerName: firstRow.CustomerName,
      issueDate: firstRow.IssueDate.toISOString(),
      dueDate: firstRow.DueDate.toISOString(),
      status: firstRow.Status as 'Paid' | 'Pending' | 'Overdue',
      amount: firstRow.Amount,
      notes: firstRow.Notes,
      seller: {
        name: firstRow.SellerName,
        address: firstRow.SellerAddress,
        email: firstRow.SellerEmail,
        ntn: firstRow.SellerNTN,
        province: firstRow.SellerProvince
      },
      buyer: {
        name: firstRow.BuyerName,
        address: firstRow.BuyerAddress,
        email: firstRow.BuyerEmail,
        ntn: firstRow.BuyerNTN,
        province: firstRow.BuyerProvince
      },
      lineItems: []
    };

    // Add line items
    result.recordset.forEach(row => {
      if (row.LineItemId) {
        invoice.lineItems.push({
          description: row.LineItemDescription || '',
          quantity: row.Quantity || 0,
          unitPrice: row.UnitPrice || 0,
          total: row.LineItemTotal || 0,
          hsCode: row.HSCode || '',
          rate: row.Rate || '',
          uoM: row.UoM || '',
          saleType: row.SaleType || ''
        });
      }
    });

    return invoice;
  } catch (error) {
    console.error('Get invoice by ID error:', error);
    return null;
  }
}

// Update invoice status
export async function updateInvoiceStatus(invoiceId: string, status: 'Paid' | 'Pending' | 'Overdue', userId?: string): Promise<boolean> {
  try {
    let whereClause = 'Id = @invoiceId';
    const parameters: { [key: string]: unknown } = { invoiceId, status };

    if (userId) {
      whereClause += ' AND UserId = @userId';
      parameters.userId = userId;
    }

    await executeQuery(
      `UPDATE Invoices SET Status = @status WHERE ${whereClause}`,
      parameters
    );
    return true;
  } catch (error) {
    console.error('Update invoice status error:', error);
    return false;
  }
}

// Delete invoice
export async function deleteInvoice(invoiceId: string, userId?: string): Promise<boolean> {
  try {
    let whereClause = 'Id = @invoiceId';
    const parameters: { [key: string]: unknown } = { invoiceId };

    if (userId) {
      whereClause += ' AND UserId = @userId';
      parameters.userId = userId;
    }

    // Line items will be deleted automatically due to CASCADE constraint
    await executeQuery(`DELETE FROM Invoices WHERE ${whereClause}`, parameters);
    return true;
  } catch (error) {
    console.error('Delete invoice error:', error);
    return false;
  }
}

// Get recent invoices for dashboard
export async function getRecentInvoices(userId: string, limit: number = 5): Promise<Invoice[]> {
  try {
    const result = await getInvoices({ userId }, 1, limit);
    return result.invoices;
  } catch (error) {
    console.error('Get recent invoices error:', error);
    throw error;
  }
}
