
import type { Invoice } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, QrCode } from 'lucide-react';

interface InvoicePreviewProps {
  invoice: Invoice;
}

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary tracking-tight">INVOICE</h2>
            <p className="text-muted-foreground">{invoice.id || 'INV-XXXX'}</p>
          </div>
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-muted-foreground">From</h3>
            <p className="font-bold">{invoice.seller?.name || 'Seller Name'}</p>
            <p className="text-sm">{invoice.seller?.address || 'Seller Address'}</p>
            <p className="text-sm">{invoice.seller?.ntn || 'Seller NTN'}</p>
          </div>
          <div className="sm:text-right">
            <h3 className="font-semibold text-muted-foreground">To</h3>
            <p className="font-bold">{invoice.buyer?.name || 'Buyer Name'}</p>
            <p className="text-sm">{invoice.buyer?.address || 'Buyer Address'}</p>
            <p className="text-sm">{invoice.buyer?.ntn || 'Buyer NTN'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <h3 className="font-semibold text-muted-foreground">Status</h3>
                <Badge variant={invoice.status === 'Paid' ? 'default' : 'secondary'} className={invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>{invoice.status}</Badge>
            </div>
             <div>
                <h3 className="font-semibold text-muted-foreground">Issue Date</h3>
                <p>{invoice.issueDate || '---'}</p>
            </div>
             <div className="sm:text-right">
                <h3 className="font-semibold text-muted-foreground">Due Date</h3>
                <p>{invoice.dueDate || '---'}</p>
            </div>
        </div>

        <Separator />

        <div className="overflow-x-auto">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 font-semibold text-muted-foreground px-2 min-w-[400px]">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Unit Price</span>
                <span className="text-right">Total</span>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2 min-w-[400px]">
                {(invoice.lineItems || []).map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center rounded-md hover:bg-muted/50 p-2">
                    <span className="font-medium truncate">{item.description || '...'}</span>
                    <span className="text-right">{item.quantity}</span>
                    <span className="text-right">PKR {item.unitPrice.toFixed(2)}</span>
                    <span className="text-right font-semibold">PKR {((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}</span>
                </div>
                ))}
                {(!invoice.lineItems || invoice.lineItems.length === 0) && (
                <p className="text-center text-muted-foreground p-4">No items added yet.</p>
                )}
            </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
           <div className="flex flex-col items-center">
             <QrCode className="h-20 w-20 text-muted-foreground" />
             <p className="text-xs text-muted-foreground mt-1">FBR Digital Invoicing</p>
           </div>
          <div className="w-full sm:w-auto sm:max-w-xs space-y-2 text-right">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>PKR {invoice.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {invoice.notes && (
            <>
                <Separator />
                <div>
                    <h3 className="font-semibold text-muted-foreground">Notes</h3>
                    <p className="text-sm italic">{invoice.notes}</p>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}
