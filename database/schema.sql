-- FBR InvoicePilot Database Schema for SQL Server
-- Created: Migration from Firebase to SQL Server

-- Create Database
-- CREATE DATABASE FBRInvoicePilot;
-- USE FBRInvoicePilot;

-- Users Table
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
);

-- Customers Table
CREATE TABLE Customers (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255),
    Address NVARCHAR(500) NOT NULL,
    NTN NVARCHAR(20) NOT NULL,
    Province NVARCHAR(100) NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Filer', 'Non-Filer')),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Products Table
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
);

-- Invoices Table
CREATE TABLE Invoices (
    Id NVARCHAR(100) PRIMARY KEY, -- Using invoice ID format like INV-1234
    UserId UNIQUEIDENTIFIER NOT NULL,
    CustomerName NVARCHAR(255) NOT NULL,
    IssueDate DATE NOT NULL,
    DueDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL CHECK (Status IN ('Paid', 'Pending', 'Overdue')),
    Amount DECIMAL(18,2) NOT NULL,
    Notes NVARCHAR(1000),
    -- Seller Information
    SellerName NVARCHAR(255) NOT NULL,
    SellerAddress NVARCHAR(500) NOT NULL,
    SellerEmail NVARCHAR(255),
    SellerNTN NVARCHAR(20) NOT NULL,
    SellerProvince NVARCHAR(100) NOT NULL,
    -- Buyer Information
    BuyerName NVARCHAR(255) NOT NULL,
    BuyerAddress NVARCHAR(500) NOT NULL,
    BuyerEmail NVARCHAR(255),
    BuyerNTN NVARCHAR(20) NOT NULL,
    BuyerProvince NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Invoice Line Items Table
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
);

-- Sessions Table (for JWT session management)
CREATE TABLE Sessions (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    Token NVARCHAR(500) NOT NULL,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES Users(Id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IX_Customers_UserId ON Customers(UserId);
CREATE INDEX IX_Products_UserId ON Products(UserId);
CREATE INDEX IX_Invoices_UserId ON Invoices(UserId);
CREATE INDEX IX_Invoices_Status ON Invoices(Status);
CREATE INDEX IX_Invoices_IssueDate ON Invoices(IssueDate);
CREATE INDEX IX_InvoiceLineItems_InvoiceId ON InvoiceLineItems(InvoiceId);
CREATE INDEX IX_Sessions_UserId ON Sessions(UserId);
CREATE INDEX IX_Sessions_Token ON Sessions(Token);
CREATE INDEX IX_Sessions_ExpiresAt ON Sessions(ExpiresAt);

-- Triggers for updating UpdatedAt columns
CREATE TRIGGER TR_Users_UpdatedAt
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users 
    SET UpdatedAt = GETDATE()
    FROM Users u
    INNER JOIN inserted i ON u.Id = i.Id
END;

CREATE TRIGGER TR_Customers_UpdatedAt
ON Customers
AFTER UPDATE
AS
BEGIN
    UPDATE Customers 
    SET UpdatedAt = GETDATE()
    FROM Customers c
    INNER JOIN inserted i ON c.Id = i.Id
END;

CREATE TRIGGER TR_Products_UpdatedAt
ON Products
AFTER UPDATE
AS
BEGIN
    UPDATE Products 
    SET UpdatedAt = GETDATE()
    FROM Products p
    INNER JOIN inserted i ON p.Id = i.Id
END;

CREATE TRIGGER TR_Invoices_UpdatedAt
ON Invoices
AFTER UPDATE
AS
BEGIN
    UPDATE Invoices 
    SET UpdatedAt = GETDATE()
    FROM Invoices inv
    INNER JOIN inserted i ON inv.Id = i.Id
END;

-- Insert default admin user (password: Admin123!)
-- Password hash for 'Admin123!' using bcrypt
INSERT INTO Users (Id, Name, Email, PasswordHash, Role, RegistrationDate, LastLogin)
VALUES (
    NEWID(),
    'System Administrator',
    'admin@fbr.gov.pk',
    '$2b$10$YQZ8gZqwYQX5YQX5YQX5YQX5YQX5YQX5YQX5YQX5YQX5YQX5YQX5Y', -- This needs to be generated properly
    'admin',
    GETDATE(),
    GETDATE()
);
