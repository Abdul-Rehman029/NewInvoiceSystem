import { z } from 'zod';

export const DigitalInvoiceInputSchema = z.object({
  invoiceType: z.enum(['Sale Invoice', 'Debit Note']),
  invoiceDate: z.string().describe('YYYY-MM-DD format'),
  sellerNTNCNIC: z.string().min(7).max(13),
  sellerBusinessName: z.string(),
  sellerProvince: z.string(),
  sellerAddress: z.string(),
  buyerNTNCNIC: z.string().min(7).max(13).optional(),
  buyerBusinessName: z.string(),
  buyerProvince: z.string(),
  buyerAddress: z.string(),
  buyerRegistrationType: z.enum(['Registered', 'Unregistered']),
  invoiceRefNo: z.string().optional(),
  scenarioId: z.string().optional().describe('For Sandbox only'),
  items: z.array(
    z.object({
      hsCode: z.string(),
      productDescription: z.string(),
      rate: z.string().describe('e.g., "18%"'),
      uoM: z.string(),
      quantity: z.number(),
      totalValues: z.number().describe('Total Sales Value (Including Tax)'),
      valueSalesExcludingST: z.number(),
      fixedNotifiedValueOrRetailPrice: z.number(),
      salesTaxApplicable: z.number(),
      salesTaxWithheldAtSource: z.number(),
      extraTax: z.number().optional(),
      furtherTax: z.number().optional(),
      sroScheduleNo: z.string().optional(),
      fedPayable: z.number().optional(),
      discount: z.number().optional(),
      saleType: z.string(),
      sroItemSerialNo: z.string().optional(),
    })
  ),
  isSandbox: z.boolean().default(true),
});

export type DigitalInvoiceInput = z.infer<typeof DigitalInvoiceInputSchema>;

export const DigitalInvoiceOutputSchema = z.object({
  invoiceNumber: z.string().optional(),
  dated: z.string(),
  validationResponse: z.object({
    statusCode: z.string(),
    status: z.string(),
    error: z.string(),
    errorCode: z.string().nullable().optional(),
    invoiceStatuses: z.array(z.object({
      itemSNo: z.string(),
      statusCode: z.string(),
      status: z.string(),
      invoiceNo: z.string().nullable(),
      errorCode: z.string().nullable(),
      error: z.string(),
    })).nullable(),
  }),
});

export type DigitalInvoiceOutput = z.infer<typeof DigitalInvoiceOutputSchema>;
