import { generateTaxSummaryPdf } from './src/utils/generateTaxSummaryPdf';
import fs from 'fs/promises';

const dummySummary = `
TAX DOCUMENT SUMMARY

Document Type: Revenue Processing Tax Filing Questionnaire
Tax Year: 2024
Prepared By: TaxMind Automated Analysis

INCOME AND TAX DETAILS

Gross Income: €54,713.21
Taxable Income: €54,713.21
PAYE Deducted: €2,351.92
USC Deducted: €1,053.09
Total Tax Paid: €3,405.01

FINAL ASSESSMENT

Assessment Result: Refund
Amount: €1,874.61
Payment Method: Bank Transfer

KEY ALLOWANCES AND TAX CREDITS

Rent Tax Credit: €500.00
Medical Expenses: €350.00

NOTES AND OBSERVATIONS

Between you and your spouse, you earned a combined €54,713.21 in 2024 across two employments. Revenue collected €2,351.92 in income tax and €1,053.09 in USC. After applying €10,335.00 in tax credits and reliefs, you were owed more than you paid. Revenue issued a total refund of €1,874.61 — €1,662.40 to your account and €212.21 to your spouse. Your household effective tax rate was just 6.2%.
`;

async function run() {
    try {
        console.log('Generating dummy tax summary PDF...');
        const pdfBuffer = await generateTaxSummaryPdf({
            name: 'Akshay',
            summary: dummySummary.trim(),
            year: 2024
        });

        await fs.writeFile('test-output.pdf', pdfBuffer);
        console.log('Successfully saved to test-output.pdf');
    } catch (e) {
        console.error('Failed to generate PDF:', e);
    }
}

run();
