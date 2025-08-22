'use server';

/**
 * @fileOverview A flow that extracts data from invoice images or PDFs.
 *
 * - extractInvoiceData - A function that handles the invoice data extraction process.
 * - ExtractInvoiceDataInput - The input type for the extractInvoiceData function.
 * - ExtractInvoiceDataOutput - The return type for the extractInvoiceData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractInvoiceDataInputSchema = z.object({
  invoiceDataUri: z
    .string()
    .describe(
      "A data URI of an invoice image or PDF. It must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractInvoiceDataInput = z.infer<typeof ExtractInvoiceDataInputSchema>;

const ExtractInvoiceDataOutputSchema = z.object({
  invoiceDetails: z.object({
    invoiceNumber: z.string().describe('The invoice number.'),
    invoiceDate: z.string().describe('The invoice date.'),
    sellerName: z.string().describe('The name of the seller.'),
    buyerName: z.string().describe('The name of the buyer.'),
    totalAmount: z.number().describe('The total amount of the invoice.'),
    lineItems: z.array(
      z.object({
        description: z.string().describe('Description of the item.'),
        quantity: z.number().describe('Quantity of the item.'),
        unitPrice: z.number().describe('Unit price of the item.'),
        amount: z.number().describe('Total amount for the item.'),
        hsCode: z.string().describe('Harmonized System (HS) Code of the product.'),
        rate: z.string().describe('Tax Rate as a percentage string e.g. "18%"'),
        uoM: z.string().describe('Unit of Measurement'),
        saleType: z.string().describe('Type of Sale'),
      })
    ).describe('List of line items in the invoice.'),
  }).describe('Extracted details from the invoice.'),
});
export type ExtractInvoiceDataOutput = z.infer<typeof ExtractInvoiceDataOutputSchema>;

export async function extractInvoiceData(input: ExtractInvoiceDataInput): Promise<ExtractInvoiceDataOutput> {
  return extractInvoiceDataFlow(input);
}

const extractInvoiceDataPrompt = ai.definePrompt({
  name: 'extractInvoiceDataPrompt',
  input: {schema: ExtractInvoiceDataInputSchema},
  output: {schema: ExtractInvoiceDataOutputSchema},
  prompt: `You are an expert AI assistant specialized in extracting data from invoices.

You will receive an invoice image or PDF, and your task is to extract the following information:

- Invoice Number
- Invoice Date
- Seller Name
- Buyer Name
- Total Amount
- Line Items (description, quantity, unitPrice, amount, hsCode, rate, uoM, saleType)

Return the extracted data in JSON format according to the schema.

Here is the invoice data: {{media url=invoiceDataUri}}`,
});

const extractInvoiceDataFlow = ai.defineFlow(
  {
    name: 'extractInvoiceDataFlow',
    inputSchema: ExtractInvoiceDataInputSchema,
    outputSchema: ExtractInvoiceDataOutputSchema,
  },
  async input => {
    const {output} = await extractInvoiceDataPrompt(input);
    return output!;
  }
);
