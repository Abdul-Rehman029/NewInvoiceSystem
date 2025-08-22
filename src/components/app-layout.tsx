
"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FilePlus2, History, LayoutDashboard, ScanLine, Shield, Package, PanelLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster } from '@/components/ui/toaster';
import { useSqlAuth } from './sql-auth-provider';
import { Sidebar } from './sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useSqlAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/auth') {
      router.push('/auth');
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (pathname === '/auth' || isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        {pathname !== '/auth' && (
           <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        )}
         {pathname === '/auth' && children}
        <Toaster />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push('/auth');
  };

  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard, show: !isAdmin },
    { href: '/admin', label: 'Admin', icon: Shield, show: isAdmin },
    { href: '/invoices', label: 'Invoices', icon: History, show: !isAdmin },
    { href: '/invoices/new', label: 'Create Invoice', icon: FilePlus2, show: !isAdmin },
    { href: '/products', label: 'Products', icon: Package, show: !isAdmin },
    { href: '/extract', label: 'AI Extraction', icon: ScanLine, show: !isAdmin },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        menuItems={menuItems.filter((item) => item.show)}
        onLogout={handleLogout}
        pathname={pathname}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'md:ml-64' : 'ml-0 md:ml-20'}`}>
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
           <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
          <div className="flex items-center gap-2 ml-auto">
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{user?.name}</span>
            </p>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
