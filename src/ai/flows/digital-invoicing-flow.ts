'use server';
/**
 * @fileOverview A flow for interacting with the FBR Digital Invoicing API.
 *
 * - postInvoice - A function that posts invoice data to the FBR API.
 */

import { ai } from '@/ai/genkit';
import { DigitalInvoiceInputSchema, DigitalInvoiceOutputSchema, type DigitalInvoiceInput, type DigitalInvoiceOutput } from '@/lib/fbr-api-schema';

async function postInvoice(input: DigitalInvoiceInput): Promise<DigitalInvoiceOutput> {
  // In a real application, you would use a secure way to store and retrieve the API token.
  const apiToken = process.env.FBR_API_TOKEN;

  if (!apiToken) {
    // This is a mock response for when the API token is not set.
    // In a real application, this would throw an error.
    console.warn("FBR_API_TOKEN is not set. Returning mock success response.");
    return {
        invoiceNumber: `FBR-MOCK-${Date.now()}`,
        dated: new Date().toISOString(),
        validationResponse: {
            statusCode: "00",
            status: "Valid",
            error: "",
            errorCode: null,
            invoiceStatuses: input.items.map((_, index) => ({
                itemSNo: (index + 1).toString(),
                statusCode: "00",
                status: "Valid",
                invoiceNo: `FBR-MOCK-${Date.now()}-${index + 1}`,
                errorCode: null,
                error: ""
            }))
        }
    };
  }

  const { isSandbox, ...payload } = input;
  const url = isSandbox
    ? 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb'
    : 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata';


  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  return DigitalInvoiceOutputSchema.parse(result);
}

const postInvoiceFlow = ai.defineFlow(
  {
    name: 'postInvoiceFlow',
    inputSchema: DigitalInvoiceInputSchema,
    outputSchema: DigitalInvoiceOutputSchema,
  },
  async (input) => {
    return await postInvoice(input);
  }
);

// Export a wrapper function to be used in server actions.
export async function postInvoiceActionWrapper(input: DigitalInvoiceInput): Promise<DigitalInvoiceOutput> {
    return postInvoiceFlow(input);
}
