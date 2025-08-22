import sql from 'mssql';
import { readFileSync } from 'fs';
import { join } from 'path';

// Database configuration for initial connection to master database
const config: sql.config = {
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || 'YourStrong!Passw0rd',
  server: process.env.SQL_SERVER || 'localhost',
  database: 'master', // Connect to master first to create database
  port: parseInt(process.env.SQL_PORT || '1433'),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

async function setupDatabase() {
  let pool: sql.ConnectionPool | null = null;

  try {
    console.log('🔧 Setting up SQL Server database...');
    console.log('📊 Connecting to SQL Server...');
    
    // Connect to master database first
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to SQL Server successfully');

    // Create database if it doesn't exist
    console.log('📄 Creating database if not exists...');
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'FBRInvoicePilot')
      BEGIN
        CREATE DATABASE FBRInvoicePilot
      END
    `);
    console.log('✅ Database created/verified');

    // Close connection to master
    await pool.close();

    // Now connect to the actual database
    config.database = 'FBRInvoicePilot';
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to FBRInvoicePilot database');

    // Create tables manually to ensure they exist
    console.log('📋 Creating database tables...');
    
    // Users Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
          Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          Name NVARCHAR(255) NOT NULL,
          Email NVARCHAR(255) UNIQUE NOT NULL,
          PasswordHash NVARCHAR(255) NOT NULL,
          Role NVARCHAR(50) NOT NULL CHECK (Role IN ('admin', 'user')) DEFAULT 'user',
          RegistrationDate DATETIME2 DEFAULT GETDATE(),
          LastLogin DATETIME2,
          InvoiceCount INT DEFAULT 0,
          PaidAmount DECIMAL(18,2) DEFAULT 0,
          PendingAmount DECIMAL(18,2) DEFAULT 0,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE()
        )
      END
    `);
    console.log('✅ Users table created/verified');

    // Customers Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Customers')
      BEGIN
        CREATE TABLE Customers (
          Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          UserId UNIQUEIDENTIFIER NOT NULL,
          Name NVARCHAR(255) NOT NULL,
          Email NVARCHAR(255),
          Address NVARCHAR(500) NOT NULL,
          NTN NVARCHAR(20) NOT NULL,
          Province NVARCHAR(100) NOT NULL,
          Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Registered', 'Unregistered')),
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
        )
      END
    `);
    console.log('✅ Customers table created/verified');

    // Products Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
      BEGIN
        CREATE TABLE Products (
          Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          UserId UNIQUEIDENTIFIER NOT NULL,
          Name NVARCHAR(255) NOT NULL,
          Description NVARCHAR(500),
          UnitPrice DECIMAL(18,2) NOT NULL,
          HSCode NVARCHAR(50) NOT NULL,
          Rate NVARCHAR(20) NOT NULL,
          UoM NVARCHAR(50) NOT NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
        )
      END
    `);
    console.log('✅ Products table created/verified');

    // Invoices Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Invoices')
      BEGIN
        CREATE TABLE Invoices (
          Id NVARCHAR(100) PRIMARY KEY,
          UserId UNIQUEIDENTIFIER NOT NULL,
          CustomerName NVARCHAR(255) NOT NULL,
          IssueDate DATE NOT NULL,
          DueDate DATE NOT NULL,
          Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Paid', 'Pending', 'Overdue')),
          Amount DECIMAL(18,2) NOT NULL,
          Notes NVARCHAR(1000),
          SellerName NVARCHAR(255) NOT NULL,
          SellerAddress NVARCHAR(500) NOT NULL,
          SellerEmail NVARCHAR(255),
          SellerNTN NVARCHAR(20) NOT NULL,
          SellerProvince NVARCHAR(100) NOT NULL,
          BuyerName NVARCHAR(255) NOT NULL,
          BuyerAddress NVARCHAR(500) NOT NULL,
          BuyerEmail NVARCHAR(255),
          BuyerNTN NVARCHAR(20) NOT NULL,
          BuyerProvince NVARCHAR(100) NOT NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          UpdatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
        )
      END
    `);
    console.log('✅ Invoices table created/verified');

    // Invoice Line Items Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'InvoiceLineItems')
      BEGIN
        CREATE TABLE InvoiceLineItems (
          Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          InvoiceId NVARCHAR(100) NOT NULL,
          Description NVARCHAR(500) NOT NULL,
          Quantity DECIMAL(18,3) NOT NULL,
          UnitPrice DECIMAL(18,2) NOT NULL,
          Total DECIMAL(18,2) NOT NULL,
          HSCode NVARCHAR(50) NOT NULL,
          Rate NVARCHAR(20) NOT NULL,
          UoM NVARCHAR(50) NOT NULL,
          SaleType NVARCHAR(100) NOT NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (InvoiceId) REFERENCES Invoices(Id) ON DELETE CASCADE
        )
      END
    `);
    console.log('✅ InvoiceLineItems table created/verified');

    // Sessions Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
      BEGIN
        CREATE TABLE Sessions (
          Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          UserId UNIQUEIDENTIFIER NOT NULL,
          Token NVARCHAR(MAX) NOT NULL,
          ExpiresAt DATETIME2 NOT NULL,
          CreatedAt DATETIME2 DEFAULT GETDATE(),
          FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
        )
      END
    `);
    console.log('✅ Sessions table created/verified');

    // Create admin user with proper password hash
    console.log('👤 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const adminPassword = 'Admin123!';
    const passwordHash = await bcrypt.hash(adminPassword, 12);

    await pool.request()
      .input('passwordHash', passwordHash)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Users WHERE Email = 'admin@fbr.gov.pk')
        BEGIN
          INSERT INTO Users (Name, Email, PasswordHash, Role, RegistrationDate, LastLogin)
          VALUES ('System Administrator', 'admin@fbr.gov.pk', @passwordHash, 'admin', GETDATE(), GETDATE())
        END
      `);

    console.log('✅ Database setup completed successfully!');
    console.log('🔐 Admin credentials:');
    console.log('  Email: admin@fbr.gov.pk');
    console.log('  Password: Admin123!');
    console.log('🚀 You can now run: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('');
    console.log('💡 Using mock mode instead...');
    console.log('📝 You can test the application with mock data');
    console.log('🚀 Run: npm run dev');
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}

setupDatabase();
