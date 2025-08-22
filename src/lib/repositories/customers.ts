import { executeQuery } from '../database';
import type { Customer } from '../types';

// Get customers for a user
export async function getCustomers(userId: string): Promise<Customer[]> {
  try {
    const result = await executeQuery<Customer>(
      `SELECT Id as id, UserId as userId, Name as name, Email as email, Address as address, NTN as ntn, Province as province, Status as status, CreatedAt as createdAt, UpdatedAt as updatedAt
       FROM Customers 
       WHERE UserId = @userId 
       ORDER BY Name`,
      { userId }
    );

    return result.recordset.map(customer => ({
      id: customer.id,
      userId: customer.userId,
      name: customer.name,
      email: customer.email || '',
      address: customer.address,
      ntn: customer.ntn,
      province: customer.province,
      status: customer.status as 'Filer' | 'Non-Filer'
    }));
  } catch (error) {
    console.error('Get customers error:', error);
    throw error;
  }
}

// Get customer by ID
export async function getCustomerById(customerId: string, userId: string): Promise<Customer | null> {
  try {
    const result = await executeQuery<Customer>(
      `SELECT Id, UserId, Name, Email, Address, NTN, Province, Status
       FROM Customers 
       WHERE Id = @customerId AND UserId = @userId`,
      { customerId, userId }
    );

    if (result.recordset.length === 0) {
      return null;
    }

    const customer = result.recordset[0];
    return {
      id: customer.id,
      userId: customer.userId,
      name: customer.name,
      email: customer.email || '',
      address: customer.address,
      ntn: customer.ntn,
      province: customer.province,
      status: customer.status as 'Filer' | 'Non-Filer'
    };
  } catch (error) {
    console.error('Get customer by ID error:', error);
    return null;
  }
}

// Create customer
export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<string> {
  try {
    const result = await executeQuery<{ Id: string }>(
      `INSERT INTO Customers (UserId, Name, Email, Address, NTN, Province, Status)
       OUTPUT INSERTED.Id
       VALUES (@userId, @name, @email, @address, @ntn, @province, @status)`,
      {
        userId: customer.userId,
        name: customer.name,
        email: customer.email,
        address: customer.address,
        ntn: customer.ntn,
        province: customer.province,
        status: customer.status
      }
    );

    return result.recordset[0].Id;
  } catch (error) {
    console.error('Create customer error:', error);
    throw error;
  }
}

// Update customer
export async function updateCustomer(
  customerId: string,
  userId: string,
  updates: Partial<Omit<Customer, 'id' | 'userId'>>
): Promise<boolean> {
  try {
    const setParts: string[] = [];
    const parameters: { [key: string]: unknown } = { customerId, userId };

    if (updates.name !== undefined) {
      setParts.push('Name = @name');
      parameters.name = updates.name;
    }
    if (updates.email !== undefined) {
      setParts.push('Email = @email');
      parameters.email = updates.email;
    }
    if (updates.address !== undefined) {
      setParts.push('Address = @address');
      parameters.address = updates.address;
    }
    if (updates.ntn !== undefined) {
      setParts.push('NTN = @ntn');
      parameters.ntn = updates.ntn;
    }
    if (updates.province !== undefined) {
      setParts.push('Province = @province');
      parameters.province = updates.province;
    }
    if (updates.status !== undefined) {
      setParts.push('Status = @status');
      parameters.status = updates.status;
    }

    if (setParts.length === 0) {
      return true; // No updates needed
    }

    await executeQuery(
      `UPDATE Customers SET ${setParts.join(', ')} WHERE Id = @customerId AND UserId = @userId`,
      parameters
    );

    return true;
  } catch (error) {
    console.error('Update customer error:', error);
    return false;
  }
}

// Delete customer
export async function deleteCustomer(customerId: string, userId: string): Promise<boolean> {
  try {
    await executeQuery(
      'DELETE FROM Customers WHERE Id = @customerId AND UserId = @userId',
      { customerId, userId }
    );
    return true;
  } catch (error) {
    console.error('Delete customer error:', error);
    return false;
  }
}

// Search customers by name or email
export async function searchCustomers(userId: string, searchTerm: string): Promise<Customer[]> {
  try {
    const result = await executeQuery<Customer>(
      `SELECT Id, UserId, Name, Email, Address, NTN, Province, Status
       FROM Customers 
       WHERE UserId = @userId 
         AND (Name LIKE @searchTerm OR Email LIKE @searchTerm)
       ORDER BY Name`,
      { userId, searchTerm: `%${searchTerm}%` }
    );

    return result.recordset.map(customer => ({
      id: customer.id,
      userId: customer.userId,
      name: customer.name,
      email: customer.email || '',
      address: customer.address,
      ntn: customer.ntn,
      province: customer.province,
      status: customer.status as 'Filer' | 'Non-Filer'
    }));
  } catch (error) {
    console.error('Search customers error:', error);
    throw error;
  }
}

// Check if customer exists by email or NTN
export async function checkCustomerExists(userId: string, email?: string, ntn?: string): Promise<boolean> {
  try {
    let whereClause = 'UserId = @userId';
    const parameters: { [key: string]: unknown } = { userId };

    if (email) {
      whereClause += ' AND Email = @email';
      parameters.email = email;
    }

    if (ntn) {
      whereClause += ' AND NTN = @ntn';
      parameters.ntn = ntn;
    }

    const result = await executeQuery<{ Count: number }>(
      `SELECT COUNT(*) as Count FROM Customers WHERE ${whereClause}`,
      parameters
    );

    return result.recordset[0].Count > 0;
  } catch (error) {
    console.error('Check customer exists error:', error);
    return false;
  }
}
