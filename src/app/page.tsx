
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  CircleDollarSign,
  FileClock,
  FileText,
  Loader2,
} from 'lucide-react';

import { DashboardChart } from '@/components/dashboard-chart';
import { useSqlAuth } from '@/components/sql-auth-provider';
import type { Invoice } from '@/lib/types';
// Firebase imports removed - using SQL Server
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user } = useSqlAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    // Load recent invoices from SQL Server
    const loadRecentInvoices = async () => {
      try {
        const response = await fetch('/api/invoices?limit=5', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setInvoices(data.invoices || []);
        }
      } catch (error) {
        console.error('Error loading invoices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentInvoices();
  }, [user]);

  // Use the aggregated stats directly from the user object.
  const totalIssued = user?.invoiceCount ?? 0;
  const paidAmount = user?.paidAmount ?? 0;
  const pendingAmount = user?.pendingAmount ?? 0;

  return (
    <div className="flex flex-col gap-8 fade-in">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-transform hover:scale-[1.02] hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Issued</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalIssued}</div>
            <p className="text-xs text-muted-foreground">All invoices created</p>
          </CardContent>
        </Card>
        <Card className="transition-transform hover:scale-[1.02] hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `PKR ${paidAmount.toLocaleString()}`}</div>
            <p className="text-xs text-muted-foreground">From successfully settled invoices</p>
          </CardContent>
        </Card>
        <Card className="transition-transform hover:scale-[1.02] hover:shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `PKR ${pendingAmount.toLocaleString()}`}</div>
            <p className="text-xs text-muted-foreground">From invoices awaiting payment</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <DashboardChart />

        <Card className="col-span-4 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
            <CardDescription>
              Your most recently created invoices.
            </CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden sm:table-cell text-right">Amount</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                        </TableCell>
                    </TableRow>
                ) : invoices.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                            <p className="font-semibold">No recent invoices.</p>
                            <p className="text-muted-foreground text-sm">Create an invoice to see it here.</p>
                        </TableCell>
                    </TableRow>
                ) : (
                    invoices.map(invoice => (
                        <TableRow key={invoice.id} className="transition-colors hover:bg-muted/50">
                            <TableCell>
                            <div className="font-medium">{invoice.customerName}</div>
                            <div className="text-sm text-muted-foreground md:hidden">
                                PKR {invoice.amount.toFixed(2)}
                            </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-right">
                            PKR {invoice.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-center">
                             <Badge
                                variant={
                                  invoice.status === 'Paid'
                                    ? 'default'
                                    : invoice.status === 'Pending'
                                    ? 'secondary'
                                    : 'destructive'
                                }
                                className={`
                                  ${invoice.status === 'Paid' ? 'border-transparent bg-green-500/20 text-green-700 hover:bg-green-500/30' : ''}
                                  ${invoice.status === 'Pending' ? 'border-transparent bg-amber-500/20 text-amber-700 hover:bg-amber-500/30' : ''}
                                  ${invoice.status === 'Overdue' ? 'border-transparent bg-red-500/20 text-red-700 hover:bg-red-500/30' : ''}
                                `}
                              >
                                {invoice.status}
                              </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
