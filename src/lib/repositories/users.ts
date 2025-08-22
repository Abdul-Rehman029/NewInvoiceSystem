import { executeQuery } from '../database';
import type { User } from '../types';

export interface UserStats {
  totalUsers: number;
  totalInvoices: number;
  totalRevenue: number;
}

// Get all users (admin only)
export async function getAllUsers(): Promise<User[]> {
  try {
    const result = await executeQuery<User>(
      `SELECT Id as id, Name as name, Email as email, Role as role, RegistrationDate as registrationDate, LastLogin as lastLogin, InvoiceCount as invoiceCount, PaidAmount as paidAmount, PendingAmount as pendingAmount
       FROM Users 
       ORDER BY RegistrationDate DESC`
    );

    return result.recordset.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'user',
      registrationDate: user.registrationDate,
      lastLogin: user.lastLogin || '',
      invoiceCount: user.invoiceCount,
      paidAmount: user.paidAmount || 0,
      pendingAmount: user.pendingAmount || 0
    }));
  } catch (error) {
    console.error('Get all users error:', error);
    throw error;
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await executeQuery<User>(
      `SELECT Id as id, Name as name, Email as email, Role as role, RegistrationDate as registrationDate, LastLogin as lastLogin, InvoiceCount as invoiceCount, PaidAmount as paidAmount, PendingAmount as pendingAmount
       FROM Users 
       WHERE Id = @userId`,
      { userId }
    );

    if (result.recordset.length === 0) {
      return null;
    }

    const user = result.recordset[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as 'admin' | 'user',
      registrationDate: user.registrationDate,
      lastLogin: user.lastLogin || '',
      invoiceCount: user.invoiceCount,
      paidAmount: user.paidAmount || 0,
      pendingAmount: user.pendingAmount || 0
    };
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
}

// Update user statistics
export async function updateUserStats(
  userId: string,
  invoiceCountDelta: number = 0,
  paidAmountDelta: number = 0,
  pendingAmountDelta: number = 0
): Promise<boolean> {
  try {
    await executeQuery(
      `UPDATE Users 
       SET InvoiceCount = InvoiceCount + @invoiceCountDelta,
           PaidAmount = PaidAmount + @paidAmountDelta,
           PendingAmount = PendingAmount + @pendingAmountDelta
       WHERE Id = @userId`,
      { userId, invoiceCountDelta, paidAmountDelta, pendingAmountDelta }
    );
    return true;
  } catch (error) {
    console.error('Update user stats error:', error);
    return false;
  }
}

// Recalculate user statistics from invoices
export async function recalculateUserStats(userId: string): Promise<boolean> {
  try {
    await executeQuery(
      `UPDATE Users 
       SET InvoiceCount = (
         SELECT COUNT(*) FROM Invoices WHERE UserId = @userId
       ),
       PaidAmount = (
         SELECT ISNULL(SUM(Amount), 0) FROM Invoices 
         WHERE UserId = @userId AND Status = 'Paid'
       ),
       PendingAmount = (
         SELECT ISNULL(SUM(Amount), 0) FROM Invoices 
         WHERE UserId = @userId AND Status IN ('Pending', 'Overdue')
       )
       WHERE Id = @userId`,
      { userId }
    );
    return true;
  } catch (error) {
    console.error('Recalculate user stats error:', error);
    return false;
  }
}

// Get platform statistics (admin dashboard)
export async function getPlatformStats(): Promise<UserStats> {
  try {
    const result = await executeQuery<{
      TotalUsers: number;
      TotalInvoices: number;
      TotalRevenue: number;
    }>(
      `SELECT 
         (SELECT COUNT(*) FROM Users WHERE Role = 'user') as TotalUsers,
         (SELECT COUNT(*) FROM Invoices) as TotalInvoices,
         (SELECT ISNULL(SUM(Amount), 0) FROM Invoices WHERE Status = 'Paid') as TotalRevenue`
    );

    const stats = result.recordset[0];
    return {
      totalUsers: stats.TotalUsers,
      totalInvoices: stats.TotalInvoices,
      totalRevenue: stats.TotalRevenue
    };
  } catch (error) {
    console.error('Get platform stats error:', error);
    throw error;
  }
}

// Delete user (admin only)
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // This will cascade delete all related data due to foreign key constraints
    await executeQuery('DELETE FROM Users WHERE Id = @userId', { userId });
    return true;
  } catch (error) {
    console.error('Delete user error:', error);
    return false;
  }
}

// Update user profile
export async function updateUserProfile(userId: string, name: string, email: string): Promise<boolean> {
  try {
    await executeQuery(
      'UPDATE Users SET Name = @name, Email = @email WHERE Id = @userId',
      { userId, name, email }
    );
    return true;
  } catch (error) {
    console.error('Update user profile error:', error);
    return false;
  }
}
