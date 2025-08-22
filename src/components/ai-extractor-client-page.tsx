
"use client";

import { useState } from 'react';
import type { ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertTriangle, Wand2 } from 'lucide-react';
import type { ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
import { InvoicePreview } from '@/components/invoice-preview';
import type { Invoice } from '@/lib/types';
import { useSqlAuth } from '@/components/sql-auth-provider';

type State = {
  loading: boolean;
  error: string | null;
  data: ExtractInvoiceDataOutput | null;
};

export function AiExtractorClientPage() {
  const { user } = useSqlAuth();
  const [state, setState] = useState<State>({
    loading: false,
    error: null,
    data: null,
  });
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setState({ loading: true, error: null, data: null });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result as string;
      
      try {
        const response = await fetch('/api/ai/extract-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ invoiceDataUri: base64 }),
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to extract invoice data');
        }

        const result = await response.json();
        
        if (result.error) {
          setState({ loading: false, error: result.error, data: null });
        } else {
          setState({ loading: false, error: null, data: result.data });
        }
      } catch (error) {
        setState({ 
          loading: false, 
          error: error instanceof Error ? error.message : 'Failed to extract invoice data', 
          data: null 
        });
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setState({
        loading: false,
        error: 'Failed to read the file.',
        data: null,
      });
    };
  };

  const formattedInvoiceData: Invoice | null = state.data
    ? {
        id: state.data.invoiceDetails.invoiceNumber,
        userId: user?.id || '',
        customerName: state.data.invoiceDetails.buyerName,
        issueDate: new Date(state.data.invoiceDetails.invoiceDate).toLocaleDateString(),
        dueDate: '', // AI doesn't extract this
        status: 'Pending',
        amount: state.data.invoiceDetails.totalAmount,
        seller: { name: state.data.invoiceDetails.sellerName, address: '', email: '', ntn: '', province: '' },
        buyer: { name: state.data.invoiceDetails.buyerName, address: '', email: '', ntn: '', province: '' },
        lineItems: state.data.invoiceDetails.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.amount,
          hsCode: item.hsCode,
          rate: item.rate,
          uoM: item.uoM,
          saleType: item.saleType,
        })),
        notes: 'Data extracted by FBR Invoice Portal AI.',
      }
    : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">AI Invoice Extraction</h1>
        <Wand2 className="h-8 w-8 text-primary" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Invoice</CardTitle>
          <CardDescription>
            Upload an image or PDF of an invoice, and our AI will extract the data for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
              id="invoice-file"
              type="file"
              onChange={handleFileChange}
              accept="image/*,application/pdf"
              className="file:text-primary file:font-semibold"
              disabled={state.loading}
            />
          </div>
          {fileName && !state.loading && (
            <p className="mt-2 text-sm text-muted-foreground">
              File: {fileName}
            </p>
          )}
        </CardContent>
      </Card>

      {state.loading && (
        <div className="flex items-center justify-center rounded-lg border border-dashed p-12">
          <div className="flex flex-col items-center gap-2 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-semibold">Extracting data...</p>
            <p className="text-sm text-muted-foreground">
              Our AI is reading your invoice. This may take a moment.
            </p>
          </div>
        </div>
      )}

      {state.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Extraction Failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {formattedInvoiceData && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">Extracted Data</h2>
          <InvoicePreview invoice={formattedInvoiceData} />
        </div>
      )}
    </div>
  );
}
