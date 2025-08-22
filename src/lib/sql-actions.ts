'use server';

import { extractInvoiceData as extractInvoiceDataFlow, type ExtractInvoiceDataInput, type ExtractInvoiceDataOutput } from '@/ai/flows/extract-invoice-data';
import { postInvoiceActionWrapper } from '@/ai/flows/digital-invoicing-flow';
import type { DigitalInvoiceInput, DigitalInvoiceOutput } from './fbr-api-schema';
import type { Invoice } from './types';
import { createInvoice } from './repositories/invoices';
import { updateUserStats } from './repositories/users';

// AI Invoice Extraction Action (unchanged)
export async function extractInvoiceDataAction(
  input: ExtractInvoiceDataInput
): Promise<{ data: ExtractInvoiceDataOutput | null; error: string | null }> {
  try {
    const result = await extractInvoiceDataFlow(input);
    return { data: result, error: null };
  } catch (e: unknown) {
    console.error('Error extracting invoice data:', e);
    return { data: null, error: (e as Error).message || 'An unknown error occurred.' };
  }
}

// Action to post the invoice to the (mocked) FBR API using SQL Server
export async function postInvoiceAction(
  input: DigitalInvoiceInput,
  invoiceData: Omit<Invoice, 'id'>,
  userId: string,
): Promise<{ data: DigitalInvoiceOutput | null; error: string | null }> {
  try {
    const result = await postInvoiceActionWrapper(input);

    if (result.validationResponse.statusCode !== "00") {
        const errorMsg = result.validationResponse.error || "Invoice submission failed validation.";
        return { data: null, error: errorMsg };
    }
    
    // If submission is successful, save the invoice to SQL Server
    const finalInvoiceData = {
        ...invoiceData,
        id: result.invoiceNumber || `FBR-MOCK-${Date.now()}`, // Use official number if available
        userId: userId,
        status: 'Paid' as const, // Assuming submission implies it's paid for this mock.
    };

    // Save invoice to SQL Server
    await createInvoice(finalInvoiceData);
    
    // Update user statistics
    await updateUserStats(userId, 1, invoiceData.amount, 0);

    return { data: result, error: null };
  } catch (e: unknown) {
    console.error('Error posting invoice data:', e);
    return { data: null, error: (e as Error).message || 'An unknown error occurred during submission.' };
  }
}

// Action to validate the invoice with the (mocked) FBR API
export async function validateInvoiceAction(
    input: DigitalInvoiceInput
): Promise<{ error: string | null }> {
    try {
        // Here we would call the validateinvoicedata endpoint.
        // For now, we'll simulate a successful validation by calling the main flow
        // and checking the response, without creating a separate validation flow.
        console.log("Simulating validation for:", input);
        const result = await postInvoiceActionWrapper(input);

        if (result.validationResponse.statusCode !== "00") {
            const errorMsg = result.validationResponse.error || "Invoice validation failed.";
            return { error: errorMsg };
        }
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        return { error: null };
    } catch (e: unknown) {
        console.error('Error validating invoice data:', e);
        return { error: (e as Error).message || 'An unknown error occurred during validation.' };
    }
}
