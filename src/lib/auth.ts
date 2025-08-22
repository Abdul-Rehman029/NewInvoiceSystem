import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { executeQuery } from './database';
import type { User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = 12;

export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

export interface LoginResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export interface RegisterResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET as jwt.Secret,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

// Login user
export async function loginUser(email: string, password: string): Promise<LoginResult> {
  try {
    const result = await executeQuery<{
      Id: string;
      Name: string;
      Email: string;
      PasswordHash: string;
      Role: string;
      RegistrationDate: Date;
      LastLogin: Date;
      InvoiceCount: number;
      PaidAmount: number;
      PendingAmount: number;
    }>(
      'SELECT Id, Name, Email, PasswordHash, Role, RegistrationDate, LastLogin, InvoiceCount, PaidAmount, PendingAmount FROM Users WHERE Email = @email',
      { email }
    );

    if (result.recordset.length === 0) {
      return { success: false, error: 'Invalid email or password' };
    }

    const user = result.recordset[0];
    const isPasswordValid = await verifyPassword(password, user.PasswordHash);

    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Update last login
    await executeQuery(
      'UPDATE Users SET LastLogin = GETDATE() WHERE Id = @userId',
      { userId: user.Id }
    );

    const authUser: AuthUser = {
      id: user.Id,
      email: user.Email,
      role: user.Role as 'admin' | 'user'
    };

    const token = generateToken(authUser);

    // Store session in database
    await executeQuery(
      'INSERT INTO Sessions (UserId, Token, ExpiresAt) VALUES (@userId, @token, DATEADD(day, 7, GETDATE()))',
      { userId: user.Id, token }
    );

    return { success: true, user: authUser, token };
  } catch {
    return { success: false, error: 'An error occurred during login' };
  }
}

// Register user
export async function registerUser(name: string, email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<RegisterResult> {
  try {
    // Check if user already exists
    const existingUser = await executeQuery(
      'SELECT Id FROM Users WHERE Email = @email',
      { email }
    );

    if (existingUser.recordset.length > 0) {
      return { success: false, error: 'User with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert new user
    const result = await executeQuery<{ Id: string }>(
      `INSERT INTO Users (Name, Email, PasswordHash, Role) 
       OUTPUT INSERTED.Id
       VALUES (@name, @email, @passwordHash, @role)`,
      { name, email, passwordHash, role }
    );

    const userId = result.recordset[0].Id;

    const authUser: AuthUser = {
      id: userId,
      email,
      role
    };

    return { success: true, user: authUser };
  } catch {
    return { success: false, error: 'An error occurred during registration' };
  }
}

// Get user by ID
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await executeQuery<{
      Id: string;
      Name: string;
      Email: string;
      Role: string;
      RegistrationDate: Date;
      LastLogin: Date;
      InvoiceCount: number;
      PaidAmount: number;
      PendingAmount: number;
    }>(
      'SELECT Id, Name, Email, Role, RegistrationDate, LastLogin, InvoiceCount, PaidAmount, PendingAmount FROM Users WHERE Id = @userId',
      { userId }
    );

    if (result.recordset.length === 0) {
      return null;
    }

    const userData = result.recordset[0];
    return {
      id: userData.Id,
      name: userData.Name,
      email: userData.Email,
      role: userData.Role as 'admin' | 'user',
      registrationDate: userData.RegistrationDate.toISOString(),
      lastLogin: userData.LastLogin?.toISOString() || '',
      invoiceCount: userData.InvoiceCount,
      paidAmount: userData.PaidAmount,
      pendingAmount: userData.PendingAmount
    };
  } catch {
    return null;
  }
}

// Logout user (invalidate session)
export async function logoutUser(token: string): Promise<boolean> {
  try {
    await executeQuery(
      'DELETE FROM Sessions WHERE Token = @token',
      { token }
    );
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

// Validate session
export async function validateSession(token: string): Promise<AuthUser | null> {
  try {
    // Check if session exists and is not expired
    const result = await executeQuery<{ UserId: string }>(
      'SELECT UserId FROM Sessions WHERE Token = @token AND ExpiresAt > GETDATE()',
      { token }
    );

    if (result.recordset.length === 0) {
      return null;
    }

    const userId = result.recordset[0].UserId;
    const user = await getUserById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as 'admin' | 'user'
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

// Clean expired sessions
export async function cleanExpiredSessions(): Promise<void> {
  try {
    await executeQuery('DELETE FROM Sessions WHERE ExpiresAt <= GETDATE()');
  } catch (error) {
    console.error('Clean sessions error:', error);
  }
}
