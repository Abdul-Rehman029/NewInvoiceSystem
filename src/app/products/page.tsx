
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PlusCircle, Package, Loader2 } from "lucide-react";
import { useSqlAuth } from "@/components/sql-auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Product } from "@/lib/types";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  unitPrice: z.coerce.number().min(0, "Price must be non-negative"),
  hsCode: z.string().min(1, "HS Code is required"),
  rate: z.string().min(1, "Rate is required (e.g., 18%)"),
  uoM: z.string().min(1, "Unit of Measure is required"),
});

type ProductFormData = Omit<Product, "id" | "userId">;

export default function ProductsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { products, addProduct, isLoading } = useSqlAuth();
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      unitPrice: 0,
      hsCode: "",
      rate: "18%",
      uoM: "pcs",
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      await addProduct(data);
      toast({
        title: "Product Added",
        description: `${data.name} has been saved.`,
      });
      form.reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to add product:", error);
      toast({
        title: "Error",
        description: "Could not save the product.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter the details for a new product to save it to your catalog.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} id="add-product-form" className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., High-Quality Fabric" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Detailed description of the product" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="unitPrice"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Unit Price (PKR)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 5000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="rate"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Tax Rate</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 18%" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 </div>
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="hsCode"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>HS Code</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 5208.1100" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="uoM"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>UoM</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., meters" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
              </form>
            </Form>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" form="add-product-form" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Save Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>A list of all products in your catalog.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="hidden md:table-cell">HS Code</TableHead>
                  <TableHead className="hidden sm:table-cell">UoM</TableHead>
                  <TableHead className="text-right">Unit Price (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            <Package className="mx-auto h-8 w-8 text-muted-foreground mb-2"/>
                            <p className="font-semibold">No products found.</p>
                            <p className="text-muted-foreground text-sm">Click &quot;Add Product&quot; to get started.</p>
                        </TableCell>
                    </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="hidden md:table-cell">{product.hsCode}</TableCell>
                      <TableCell className="hidden sm:table-cell">{product.uoM}</TableCell>
                      <TableCell className="text-right">{product.unitPrice.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
