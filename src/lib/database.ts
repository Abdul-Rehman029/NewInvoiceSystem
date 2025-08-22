import sql from 'mssql';
import { mockExecuteQuery, mockExecuteProcedure, mockPool } from './mock-database';

// Database configuration
const config: sql.config = {
  user: process.env.SQL_USER || 'sa',
  password: process.env.SQL_PASSWORD || 'YourStrong!Passw0rd',
  server: process.env.SQL_SERVER || 'localhost',
  database: process.env.SQL_DATABASE || 'FBRInvoicePilot',
  port: parseInt(process.env.SQL_PORT || '1433'),
  options: {
    encrypt: false, // For Azure use true
    trustServerCertificate: true, // For local dev / self-signed certs
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;
let useMockMode = false;

// Initialize connection pool
export async function initializePool(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }

  try {
    console.log('Connecting to SQL Server...');
    console.log('Config:', {
      server: config.server,
      port: config.port,
      database: config.database,
      user: config.user
    });
    
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Connected to SQL Server successfully');
    useMockMode = false;
    return pool;
  } catch (error) {
    console.log('⚠️ SQL Server connection failed, using mock mode');
    console.log('Error details:', error);
    console.log('To use real SQL Server, ensure Docker is running with:');
    console.log('docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong!Passw0rd" -p 1433:1433 --name sqlserver2022 -d mcr.microsoft.com/mssql/server:2022-latest');
    useMockMode = true;
    return mockPool as any;
  }
}

// Execute query
export async function executeQuery<T>(query: string, parameters: { [key: string]: unknown } = {}): Promise<sql.IResult<T>> {
  if (useMockMode) {
    const result = await mockExecuteQuery<T>(query, parameters);
    return result as sql.IResult<T>;
  }

  const connection = await initializePool();
  const request = connection.request();

  // Add parameters
  Object.entries(parameters).forEach(([key, value]) => {
    request.input(key, value);
  });

  return await request.query<T>(query);
}

// Execute stored procedure
export async function executeProcedure<T>(procedureName: string, parameters: { [key: string]: unknown } = {}): Promise<sql.IProcedureResult<T>> {
  if (useMockMode) {
    const result = await mockExecuteProcedure<T>(procedureName, parameters);
    return result as sql.IProcedureResult<T>;
  }

  const connection = await initializePool();
  const request = connection.request();

  // Add parameters
  Object.entries(parameters).forEach(([key, value]) => {
    request.input(key, value);
  });

  return await request.execute<T>(procedureName);
}

// Execute transaction
export async function executeTransaction<T>(
  transactionFn: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  if (useMockMode) {
    // For mock mode, just execute the function without transaction
    const mockTransaction = {} as sql.Transaction;
    return await transactionFn(mockTransaction);
  }

  const connection = await initializePool();
  const transaction = new sql.Transaction(connection);
  
  try {
    await transaction.begin();
    const result = await transactionFn(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Close connection pool
export async function closePool(): Promise<void> {
  if (pool && !useMockMode) {
    await pool.close();
    pool = null;
  }
}

// Check if using mock mode
export function isMockMode(): boolean {
  return useMockMode;
}
