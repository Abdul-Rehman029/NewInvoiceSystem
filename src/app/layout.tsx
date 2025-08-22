
import './globals.css';
import type { Metadata } from 'next';
import { ClientProviders } from '@/components/client-providers';
import { AppLayout } from '@/components/app-layout';

export const metadata: Metadata = {
    title: 'FBR Invoice Portal',
    description: 'Digital Invoicing Solution for FBR Pakistan',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ClientProviders>
          <AppLayout>{children}</AppLayout>
        </ClientProviders>
      </body>
    </html>
  );
}
