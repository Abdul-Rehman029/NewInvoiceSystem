
"use client";

import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2, Save, Loader2, ShieldCheck, Users, UserPlus, Package } from 'lucide-react';
import { InvoicePreview } from './invoice-preview';
import { useToast } from '@/hooks/use-toast';
import type { Invoice, LineItem } from '@/lib/types';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { DigitalInvoiceInput } from '@/lib/fbr-api-schema';
import { Label } from '@/components/ui/label';
import { AddCustomerDialog, type CustomerFormData } from './add-customer-dialog';
import { useSqlAuth } from './sql-auth-provider';

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive'),
  unitPrice: z.coerce.number().min(0, 'Price must be non-negative'),
  hsCode: z.string().min(1, 'HS Code is required'),
  rate: z.string().min(1, 'Rate is required'),
  uoM: z.string().min(1, 'UoM is required'),
  saleType: z.string().min(1, 'Sale Type is required'),
  total: z.number().optional(), // Not part of form, but can be on object
});

const invoicePartySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  ntn: z.string().min(7, "NTN/CNIC must be at least 7 characters").max(13, "NTN/CNIC cannot exceed 13 characters"),
  province: z.string().min(1, "Province is required"),
});

const invoiceSchema = z.object({
  seller: invoicePartySchema,
  buyer: invoicePartySchema,
  buyerRegistrationType: z.enum(['Registered', 'Unregistered']),
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  issueDate: z.date({ required_error: 'Issue date is required' }),
  dueDate: z.date({ required_error: 'Due date is required' }),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
}).refine(data => {
    if (data.buyerRegistrationType === 'Registered') {
        return !!data.buyer.ntn;
    }
    return true;
}, {
    message: "NTN/CNIC is required for registered buyers.",
    path: ["buyer", "ntn"],
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

const defaultLineItem = { description: '', quantity: 1, unitPrice: 0, hsCode: '', rate: '18%', uoM: 'pcs', saleType: 'Goods at standard rate (default)' };

export function CreateInvoiceClientPage() {
  const { user, customers, addCustomer, products } = useSqlAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    // Default values are set in useEffect to avoid hydration errors
  });
  
  useEffect(() => {
    setIsMounted(true);
    form.reset({
      seller: { name: 'Pak Textile Solutions', address: '123 Textile Ave, Faisalabad', email: 'billing@paktextile.com', ntn: '1234567-8', province: 'Punjab'},
      buyer: { name: '', address: '', email: '', ntn: '', province: ''},
      buyerRegistrationType: 'Registered',
      invoiceId: `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      lineItems: [defaultLineItem],
      notes: 'Thank you for your business!',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'lineItems',
  });
  
  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue('buyer.name', customer.name);
      form.setValue('buyer.email', customer.email || '');
      form.setValue('buyer.address', customer.address);
      form.setValue('buyer.ntn', customer.ntn);
      form.setValue('buyer.province', customer.province);
    }
  };
  
  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId);
    if (product) {
        update(index, {
            ...fields[index],
            description: product.description,
            unitPrice: product.unitPrice,
            hsCode: product.hsCode,
            rate: product.rate,
            uoM: product.uoM,
        });
    }
  };
  
  const handleAddCustomer = async (newCustomerData: CustomerFormData) => {
    await addCustomer(newCustomerData);
    setIsCustomerDialogOpen(false);
  }

  const watchedValues = form.watch();

  const calculateTotals = (lineItems: LineItem[]): { subtotal: number; total: number } => {
    const subtotal = (lineItems || []).reduce((acc, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return acc + quantity * unitPrice;
    }, 0);
    // This is simplified. A real tax calculation would be more complex.
    return { subtotal, total: subtotal };
  };

  const { total } = calculateTotals((watchedValues.lineItems || []).map(item => ({
    ...item,
    total: item.total || 0
  })));

  const formatDataForApi = (data: InvoiceFormData): DigitalInvoiceInput => {
    return {
      invoiceType: 'Sale Invoice', // Or determine from form
      invoiceDate: format(data.issueDate, 'yyyy-MM-dd'),
      sellerNTNCNIC: data.seller.ntn,
      sellerBusinessName: data.seller.name,
      sellerProvince: data.seller.province,
      sellerAddress: data.seller.address,
      buyerNTNCNIC: data.buyer.ntn,
      buyerBusinessName: data.buyer.name,
      buyerProvince: data.buyer.province,
      buyerAddress: data.buyer.address,
      buyerRegistrationType: data.buyerRegistrationType,
      items: data.lineItems.map(item => ({
        hsCode: item.hsCode,
        productDescription: item.description,
        rate: item.rate,
        uoM: item.uoM,
        quantity: item.quantity,
        valueSalesExcludingST: item.unitPrice * item.quantity,
        salesTaxApplicable: (item.unitPrice * item.quantity) * (parseFloat(item.rate) / 100),
        totalValues: (item.unitPrice * item.quantity) * (1 + (parseFloat(item.rate) / 100)),
        fixedNotifiedValueOrRetailPrice: 0, // Mocked
        salesTaxWithheldAtSource: 0, // Mocked
        saleType: item.saleType,
      })),
      isSandbox: true, // Use sandbox for now
    };
  };

  const onValidate = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: "Invalid Form",
        description: "Please fill out all required fields before validating.",
        variant: "destructive"
      });
      return;
    }

    setIsValidating(true);
    const apiData = formatDataForApi(form.getValues());
    
    try {
      const response = await fetch('/api/fbr/validate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
        credentials: 'include'
      });

      const result = await response.json();
      setIsValidating(false);

      if (result.error) {
        toast({
          title: 'Validation Failed',
          description: `Mocked Error: ${result.error}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: 'Validation Successful!',
          description: 'This invoice is valid (Simulated).',
          className: 'bg-green-100 text-green-800'
        });
      }
    } catch {
      setIsValidating(false);
      toast({
        title: 'Validation Failed',
        description: 'Failed to validate invoice',
        variant: "destructive"
      });
    }
  };

  const onSubmit = async (data: InvoiceFormData) => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    const apiData = formatDataForApi(data);
    
    // Prepare the invoice data for our own database
    const dbInvoiceData: Omit<Invoice, 'id'> = {
        userId: user.id,
        customerName: data.buyer.name,
        issueDate: format(data.issueDate, 'yyyy-MM-dd'),
        dueDate: format(data.dueDate, 'yyyy-MM-dd'),
        status: 'Pending', // Will be updated upon successful submission
        amount: total,
        seller: data.seller,
        buyer: data.buyer,
        lineItems: data.lineItems.map(item => ({
            ...item,
            total: (item.quantity || 0) * (item.unitPrice || 0)
        })),
        notes: data.notes || '',
    };
    
    try {
      const response = await fetch('/api/fbr/post-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiData, dbInvoiceData }),
        credentials: 'include'
      });

      const result = await response.json();
      setIsSubmitting(false);

      if (result.error) {
        toast({
          title: 'Submission Failed',
          description: result.error,
          variant: "destructive"
        });
      } else {
        toast({
          title: 'Invoice Submitted to FBR!',
          description: `Official Invoice Number: ${result.data?.invoiceNumber}`,
        });
        console.log('FBR API Response:', result.data);
      
              // Reset form for next invoice
        form.reset({
          ...form.getValues(),
          buyer: { name: '', address: '', email: '', ntn: '', province: ''},
          invoiceId: `INV-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          lineItems: [defaultLineItem],
          notes: 'Thank you for your business!',
        });
      }
    } catch {
      setIsSubmitting(false);
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit invoice',
        variant: "destructive"
      });
    }
  };

  const previewData: Invoice = {
    id: watchedValues.invoiceId,
    userId: user?.id || '',
    customerName: watchedValues.buyer?.name,
    issueDate: watchedValues.issueDate ? format(watchedValues.issueDate, 'PPP') : '',
    dueDate: watchedValues.dueDate ? format(watchedValues.dueDate, 'PPP') : '',
    status: 'Pending',
    amount: total,
    seller: watchedValues.seller,
    buyer: watchedValues.buyer,
    lineItems: watchedValues.lineItems?.map(item => ({
      ...item,
      total: (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)
    })) || [],
    notes: watchedValues.notes
  };

  if (!isMounted) {
    return (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="fade-in">
    <FormProvider {...form}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
            <div className="space-y-8 lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Invoice Details</CardTitle>
                  <CardDescription>Enter seller and buyer information as per FBR requirements.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Customer Management</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Select onValueChange={handleCustomerSelect}>
                                <SelectTrigger className="w-full">
                                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <SelectValue placeholder="Load customer details..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.name} ({customer.status})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                             <AddCustomerDialog
                                open={isCustomerDialogOpen}
                                onOpenChange={setIsCustomerDialogOpen}
                                onSave={handleAddCustomer}
                            >
                                <Button type="button" variant="outline" className="w-full sm:w-auto shrink-0">
                                    <UserPlus className="mr-2 h-4 w-4"/>
                                    Add New Customer
                                </Button>
                            </AddCustomerDialog>
                        </div>
                    </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold">From (Seller)</h3>
                      <FormField name="seller.name" control={form.control} render={({ field }) => <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="seller.ntn" control={form.control} render={({ field }) => <FormItem><FormLabel>NTN/CNIC</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="seller.address" control={form.control} render={({ field }) => <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="seller.province" control={form.control} render={({ field }) => <FormItem><FormLabel>Province</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="seller.email" control={form.control} render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">To (Buyer)</h3>
                       <FormField
                        control={form.control}
                        name="buyerRegistrationType"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Buyer Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select buyer type" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Registered">Registered</SelectItem>
                                <SelectItem value="Unregistered">Unregistered</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                      <FormField name="buyer.name" control={form.control} render={({ field }) => <FormItem><FormLabel>Business Name</FormLabel><FormControl><Input {...field} placeholder="Client's Name" /></FormControl><FormMessage /></FormItem>} />
                       <FormField name="buyer.ntn" control={form.control} render={({ field }) => <FormItem><FormLabel>NTN/CNIC</FormLabel><FormControl><Input {...field} placeholder={watchedValues.buyerRegistrationType === 'Registered' ? "Required for registered buyers" : "Optional for unregistered buyers"} /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="buyer.address" control={form.control} render={({ field }) => <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} placeholder="Client's Address" /></FormControl><FormMessage /></FormItem>} />
                       <FormField name="buyer.province" control={form.control} render={({ field }) => <FormItem><FormLabel>Province</FormLabel><FormControl><Input {...field} placeholder="Client's Province" /></FormControl><FormMessage /></FormItem>} />
                      <FormField name="buyer.email" control={form.control} render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} placeholder="Client's Email" /></FormControl><FormMessage /></FormItem>} />

                    </div>
                  </div>
                  <Separator />
                   <div className="grid gap-6 md:grid-cols-3">
                    <FormField name="invoiceId" control={form.control} render={({ field }) => <FormItem><FormLabel>Invoice ID</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="issueDate" control={form.control} render={({ field }) => <FormItem><FormLabel>Issue Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>} />
                    <FormField name="dueDate" control={form.control} render={({ field }) => <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} value={field.value ? format(field.value, 'yyyy-MM-dd') : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)} /></FormControl><FormMessage /></FormItem>} />
                   </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div key={field.id} className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-10 sm:pb-4">
                        
                        <div className="sm:col-span-2">
                            <FormLabel>Product/Service</FormLabel>
                            <div className="flex gap-2">
                                <Select onValueChange={(value) => handleProductSelect(value, index)}>
                                    <SelectTrigger>
                                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="Select a product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map(product => (
                                            <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormField name={`lineItems.${index}.description`} control={form.control} render={({ field }) => <FormItem className="flex-grow"><FormControl><Input {...field} placeholder="Or enter custom description" /></FormControl><FormMessage /></FormItem>} />
                            </div>
                        </div>

                        <FormField name={`lineItems.${index}.quantity`} control={form.control} render={({ field }) => <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField name={`lineItems.${index}.unitPrice`} control={form.control} render={({ field }) => <FormItem><FormLabel>Price (PKR)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>} />
                        <FormField name={`lineItems.${index}.hsCode`} control={form.control} render={({ field }) => <FormItem><FormLabel>HS Code</FormLabel><FormControl><Input {...field} placeholder="e.g. 0101.2100" /></FormControl><FormMessage /></FormItem>} />
                        <FormField name={`lineItems.${index}.rate`} control={form.control} render={({ field }) => <FormItem><FormLabel>Rate</FormLabel><FormControl><Input {...field} placeholder="e.g. 18%" /></FormControl><FormMessage /></FormItem>} />
                        <FormField name={`lineItems.${index}.uoM`} control={form.control} render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>UoM</FormLabel><FormControl><Input {...field} placeholder="e.g. pieces" /></FormControl><FormMessage /></FormItem>} />
                        <FormField name={`lineItems.${index}.saleType`} control={form.control} render={({ field }) => <FormItem className="sm:col-span-2"><FormLabel>Sale Type</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="absolute bottom-2 right-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => append(defaultLineItem)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
                <CardContent>
                   <FormField name="notes" control={form.control} render={({ field }) => <FormItem><FormControl><Textarea {...field} placeholder="Add any additional notes..."/></FormControl><FormMessage /></FormItem>} />
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row justify-end gap-2">
                <Button type="button" variant="outline" onClick={onValidate} disabled={isValidating || isSubmitting}>
                   {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                   Validate Invoice
                </Button>
                <Button type="submit" disabled={isSubmitting || isValidating}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save & Submit to FBR
                </Button>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="sticky top-20">
                <InvoicePreview invoice={previewData} />
              </div>
            </div>
          </div>
        </form>
      </Form>
    </FormProvider>
    </div>
  );
}
