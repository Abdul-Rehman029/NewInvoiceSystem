# Migration Guide: Firebase to SQL Server

This guide explains how to migrate the FBR InvoicePilot application from Firebase to SQL Server.

## Overview

The application has been updated to support SQL Server as the database backend instead of Firebase Firestore. This includes:

- ✅ Custom authentication with JWT tokens
- ✅ SQL Server database with proper schema
- ✅ Repository pattern for data access
- ✅ API routes for all operations
- ✅ Maintained compatibility with existing UI

## Prerequisites

1. **SQL Server** - Install SQL Server 2019+ or SQL Server Express
2. **Node.js** - Version 18 or later
3. **Database Permissions** - Ensure the SQL user has permissions to create databases and tables

## Step 1: Install Dependencies

The required SQL Server dependencies have already been installed:
```bash
npm install mssql bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken @types/mssql
```

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Update the `.env.local` file with your SQL Server configuration:
   ```env
   # Database Configuration
   SQL_SERVER=localhost
   SQL_DATABASE=FBRInvoicePilot
   SQL_USER=sa
   SQL_PASSWORD=your_password_here
   SQL_PORT=1433

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d

   # Google AI API Key for Genkit
   GOOGLE_API_KEY=your_google_api_key_here

   # Mock FBR API Token (optional, for testing the mock API flow)
   FBR_API_TOKEN=your_mock_fbr_api_token_here

   # Environment
   NODE_ENV=development
   ```

## Step 3: Setup Database

Run the database setup script to create the database and tables:

```bash
npx tsx scripts/setup-database.ts
```

This will:
- Create the `FBRInvoicePilot` database
- Create all required tables with proper relationships
- Set up indexes for performance
- Create the default admin user with credentials:
  - **Email**: `admin@fbr.gov.pk`
  - **Password**: `Admin123!`

## Step 4: Update Application Code

### Option A: Switch to SQL Server (Recommended)

Update your `src/components/client-providers.tsx` to use the new SQL Auth Provider:

```typescript
import { SqlAuthProvider } from '@/components/sql-auth-provider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SqlAuthProvider>
      <Toaster />
      {children}
    </SqlAuthProvider>
  );
}
```

Update components to use the new hook:
```typescript
// Replace this:
import { useAuth } from '@/components/auth-provider';

// With this:
import { useSqlAuth as useAuth } from '@/components/sql-auth-provider';
```

Update actions imports:
```typescript
// Replace this:
import { postInvoiceAction, validateInvoiceAction } from '@/lib/actions';

// With this:
import { postInvoiceAction, validateInvoiceAction } from '@/lib/sql-actions';
```

### Option B: Keep Firebase and SQL Side by Side

Keep both systems and gradually migrate data as needed.

## Step 5: Database Schema

The SQL Server database includes these main tables:

### Users
- `Id` (UNIQUEIDENTIFIER, Primary Key)
- `Name`, `Email`, `PasswordHash`
- `Role` ('admin' or 'user')
- `InvoiceCount`, `PaidAmount`, `PendingAmount`
- Timestamps

### Customers
- `Id` (UNIQUEIDENTIFIER, Primary Key)
- `UserId` (Foreign Key to Users)
- `Name`, `Email`, `Address`, `NTN`, `Province`
- `Status` ('Filer' or 'Non-Filer')

### Products
- `Id` (UNIQUEIDENTIFIER, Primary Key)
- `UserId` (Foreign Key to Users)
- `Name`, `Description`, `UnitPrice`
- `HSCode`, `Rate`, `UoM`

### Invoices
- `Id` (NVARCHAR(100), Primary Key)
- `UserId` (Foreign Key to Users)
- Complete invoice data including seller/buyer info
- `Status` ('Paid', 'Pending', 'Overdue')

### InvoiceLineItems
- `Id` (UNIQUEIDENTIFIER, Primary Key)
- `InvoiceId` (Foreign Key to Invoices)
- Line item details

### Sessions
- JWT session management
- Token storage and expiration

## Step 6: Data Migration (Optional)

If you have existing Firebase data, you can create a migration script:

1. Export data from Firebase
2. Transform data to match SQL schema
3. Import into SQL Server using the repository functions

## Step 7: Test the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test authentication:
   - Login with admin credentials: `admin@fbr.gov.pk` / `Admin123!`
   - Create new user accounts
   - Test logout functionality

3. Test data operations:
   - Create customers
   - Create products
   - Create invoices
   - Test dashboard statistics

## Key Differences from Firebase

### Authentication
- **Before**: Firebase Authentication with Google providers
- **After**: Custom JWT-based authentication with HTTP-only cookies

### Database
- **Before**: Firestore NoSQL collections
- **After**: SQL Server relational database with foreign keys

### Real-time Updates
- **Before**: Firestore real-time listeners
- **After**: Manual refresh or polling (can be enhanced with WebSockets)

### Security
- **Before**: Firestore security rules
- **After**: Server-side authorization in API routes

## Benefits of SQL Server Migration

1. **Data Integrity**: Foreign key constraints ensure data consistency
2. **Performance**: Proper indexing and SQL optimization
3. **Reporting**: Complex queries and reporting capabilities
4. **Enterprise Integration**: Better integration with existing enterprise systems
5. **Cost Control**: No usage-based pricing like Firebase
6. **Data Ownership**: Complete control over your data

## Troubleshooting

### Connection Issues
- Verify SQL Server is running
- Check firewall settings
- Ensure TCP/IP is enabled in SQL Server Configuration Manager

### Authentication Issues
- Verify JWT_SECRET is set
- Check cookie settings for your domain
- Clear browser cookies if needed

### Database Issues
- Run the setup script again if tables are missing
- Check SQL Server logs for detailed error messages
- Verify user permissions

## Support

For issues or questions:
1. Check the database logs
2. Verify environment variables
3. Review the API route responses
4. Check browser network tab for authentication issues

## Next Steps

After successful migration, consider:
1. Setting up database backups
2. Implementing connection pooling optimization
3. Adding database monitoring
4. Setting up staging environment
5. Planning production deployment
