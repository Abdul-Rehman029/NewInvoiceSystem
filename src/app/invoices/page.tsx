
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useSqlAuth } from '@/components/sql-auth-provider';
import { useEffect, useState, useCallback } from 'react';
import type { Invoice } from '@/lib/types';
// Firebase imports removed - using SQL Server
import { useToast } from '@/hooks/use-toast';

const INVOICES_PER_PAGE = 10;

export default function InvoiceHistoryPage() {
  const { user } = useSqlAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  const fetchInvoices = useCallback(async (isInitialLoad = false) => {
    if (!user) return;

    if (isInitialLoad) {
      setIsLoading(true);
      setInvoices([]);

    } else {
      setIsLoadingMore(true);
    }

    try {
      const page = isInitialLoad ? 1 : Math.floor(invoices.length / INVOICES_PER_PAGE) + 1;
      const response = await fetch(`/api/invoices?page=${page}&limit=${INVOICES_PER_PAGE}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const newInvoices = data.invoices || [];
        
        setInvoices(prev => isInitialLoad ? newInvoices : [...prev, ...newInvoices]);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error("Error fetching invoices: ", error);
      toast({ title: "Error", description: "Could not fetch your invoices.", variant: "destructive" });
    } finally {
      if (isInitialLoad) setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [user, toast, invoices.length]);

  useEffect(() => {
    fetchInvoices(true);
  }, [user, fetchInvoices]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Invoice History</h1>
        <Button asChild>
          <Link href="/invoices/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Invoice
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Invoice ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Issue Date</TableHead>
                  <TableHead className="hidden md:table-cell">Due Date</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                   <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                            <p className="font-semibold">No invoices found.</p>
                            <p className="text-muted-foreground text-sm">Click &quot;Create Invoice&quot; to get started.</p>
                        </TableCell>
                    </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium text-primary">{invoice.id}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell className="hidden md:table-cell">{invoice.issueDate}</TableCell>
                      <TableCell className="hidden md:table-cell">{invoice.dueDate}</TableCell>
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
                      <TableCell className="text-right font-medium">PKR {invoice.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {hasMore && !isLoading && (
          <CardFooter className="py-4">
            <Button
              onClick={() => fetchInvoices(false)}
              disabled={isLoadingMore}
              className="w-full"
              variant="outline"
            >
              {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Load More
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
