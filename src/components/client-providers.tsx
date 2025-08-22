
"use client";

import { SqlAuthProvider } from './sql-auth-provider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SqlAuthProvider>
        {children}
    </SqlAuthProvider>
  );
}
