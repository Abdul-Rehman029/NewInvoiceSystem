import { executeQuery } from '../database';
import type { Product } from '../types';

// Get products for a user
export async function getProducts(userId: string): Promise<Product[]> {
  try {
    const result = await executeQuery<Product>(
      `SELECT Id as id, UserId as userId, Name as name, Description as description, UnitPrice as unitPrice, HSCode as hsCode, Rate as rate, UoM as uoM, CreatedAt as createdAt, UpdatedAt as updatedAt
       FROM Products 
       WHERE UserId = @userId 
       ORDER BY Name`,
      { userId }
    );

    return result.recordset.map(product => ({
      id: product.id,
      userId: product.userId,
      name: product.name,
      description: product.description || '',
      unitPrice: product.unitPrice,
      hsCode: product.hsCode,
      rate: product.rate,
      uoM: product.uoM
    }));
  } catch (error) {
    console.error('Get products error:', error);
    throw error;
  }
}

// Get product by ID
export async function getProductById(productId: string, userId: string): Promise<Product | null> {
  try {
    const result = await executeQuery<Product>(
      `SELECT Id as id, UserId as userId, Name as name, Description as description, UnitPrice as unitPrice, HSCode as hsCode, Rate as rate, UoM as uoM
       FROM Products 
       WHERE Id = @productId AND UserId = @userId`,
      { productId, userId }
    );

    if (result.recordset.length === 0) {
      return null;
    }

    const product = result.recordset[0];
    return {
      id: product.id,
      userId: product.userId,
      name: product.name,
      description: product.description || '',
      unitPrice: product.unitPrice,
      hsCode: product.hsCode,
      rate: product.rate,
      uoM: product.uoM
    };
  } catch (error) {
    console.error('Get product by ID error:', error);
    return null;
  }
}

// Create product
export async function createProduct(product: Omit<Product, 'id'>): Promise<string> {
  try {
    const result = await executeQuery<{ Id: string }>(
      `INSERT INTO Products (UserId, Name, Description, UnitPrice, HSCode, Rate, UoM)
       OUTPUT INSERTED.Id
       VALUES (@userId, @name, @description, @unitPrice, @hsCode, @rate, @uoM)`,
      {
        userId: product.userId,
        name: product.name,
        description: product.description,
        unitPrice: product.unitPrice,
        hsCode: product.hsCode,
        rate: product.rate,
        uoM: product.uoM
      }
    );

    return result.recordset[0].Id;
  } catch (error) {
    console.error('Create product error:', error);
    throw error;
  }
}

// Update product
export async function updateProduct(
  productId: string,
  userId: string,
  updates: Partial<Omit<Product, 'id' | 'userId'>>
): Promise<boolean> {
  try {
    const setParts: string[] = [];
    const parameters: { [key: string]: unknown } = { productId, userId };

    if (updates.name !== undefined) {
      setParts.push('Name = @name');
      parameters.name = updates.name;
    }
    if (updates.description !== undefined) {
      setParts.push('Description = @description');
      parameters.description = updates.description;
    }
    if (updates.unitPrice !== undefined) {
      setParts.push('UnitPrice = @unitPrice');
      parameters.unitPrice = updates.unitPrice;
    }
    if (updates.hsCode !== undefined) {
      setParts.push('HSCode = @hsCode');
      parameters.hsCode = updates.hsCode;
    }
    if (updates.rate !== undefined) {
      setParts.push('Rate = @rate');
      parameters.rate = updates.rate;
    }
    if (updates.uoM !== undefined) {
      setParts.push('UoM = @uoM');
      parameters.uoM = updates.uoM;
    }

    if (setParts.length === 0) {
      return true; // No updates needed
    }

    await executeQuery(
      `UPDATE Products SET ${setParts.join(', ')} WHERE Id = @productId AND UserId = @userId`,
      parameters
    );

    return true;
  } catch (error) {
    console.error('Update product error:', error);
    return false;
  }
}

// Delete product
export async function deleteProduct(productId: string, userId: string): Promise<boolean> {
  try {
    await executeQuery(
      'DELETE FROM Products WHERE Id = @productId AND UserId = @userId',
      { productId, userId }
    );
    return true;
  } catch (error) {
    console.error('Delete product error:', error);
    return false;
  }
}

// Search products by name or description
export async function searchProducts(userId: string, searchTerm: string): Promise<Product[]> {
  try {
    const result = await executeQuery<Product>(
      `SELECT Id as id, UserId as userId, Name as name, Description as description, UnitPrice as unitPrice, HSCode as hsCode, Rate as rate, UoM as uoM
       FROM Products 
       WHERE UserId = @userId 
         AND (Name LIKE @searchTerm OR Description LIKE @searchTerm)
       ORDER BY Name`,
      { userId, searchTerm: `%${searchTerm}%` }
    );

    return result.recordset.map(product => ({
      id: product.id,
      userId: product.userId,
      name: product.name,
      description: product.description || '',
      unitPrice: product.unitPrice,
      hsCode: product.hsCode,
      rate: product.rate,
      uoM: product.uoM
    }));
  } catch (error) {
    console.error('Search products error:', error);
    throw error;
  }
}

// Get popular products (most used in invoices)
export async function getPopularProducts(userId: string, limit: number = 10): Promise<Product[]> {
  try {
    const result = await executeQuery<Product & { UsageCount: number }>(
      `SELECT TOP (@limit) p.Id, p.UserId, p.Name, p.Description, p.UnitPrice, p.HSCode, p.Rate, p.UoM,
              COUNT(li.Id) as UsageCount
       FROM Products p
       LEFT JOIN InvoiceLineItems li ON p.Name = li.Description
       LEFT JOIN Invoices i ON li.InvoiceId = i.Id AND i.UserId = @userId
       WHERE p.UserId = @userId
       GROUP BY p.Id, p.UserId, p.Name, p.Description, p.UnitPrice, p.HSCode, p.Rate, p.UoM
       ORDER BY UsageCount DESC, p.Name`,
      { userId, limit }
    );

    return result.recordset.map(product => ({
      id: product.id,
      userId: product.userId,
      name: product.name,
      description: product.description || '',
      unitPrice: product.unitPrice,
      hsCode: product.hsCode,
      rate: product.rate,
      uoM: product.uoM
    }));
  } catch (error) {
    console.error('Get popular products error:', error);
    throw error;
  }
}

// Check if product exists by name
export async function checkProductExists(userId: string, name: string, excludeId?: string): Promise<boolean> {
  try {
    let whereClause = 'UserId = @userId AND Name = @name';
    const parameters: { [key: string]: unknown } = { userId, name };

    if (excludeId) {
      whereClause += ' AND Id != @excludeId';
      parameters.excludeId = excludeId;
    }

    const result = await executeQuery<{ Count: number }>(
      `SELECT COUNT(*) as Count FROM Products WHERE ${whereClause}`,
      parameters
    );

    return result.recordset[0].Count > 0;
  } catch (error) {
    console.error('Check product exists error:', error);
    return false;
  }
}
