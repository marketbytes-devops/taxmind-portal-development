import Anthropic from '@anthropic-ai/sdk';
import logger from '../logger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

export const extractTextFromPDF = async (pdfBuffer: Buffer): Promise<string> => {
    let parser;
    try {
        logger.info(`Extracting text from PDF, buffer size: ${pdfBuffer.length}`);
        parser = new PDFParse({ data: pdfBuffer, verbosity: 0 });
        const result = await parser.getText();
        return result.text;
    } catch (error: any) {
        logger.error('Error extracting text from PDF', { error: error.message, stack: error.stack });
        throw new Error(`Failed to extract text from PDF: ${error.message}`);
    } finally {
        if (parser) {
            await parser.destroy().catch((err: any) => logger.warn('Failed to destroy PDF parser', err));
        }
    }
};

export const generateTaxDocumentSummary = async (text: string): Promise<string> => {
    try {
        const apiKey = process.env.CLAUDE_API_KEY || '';
        if (!apiKey) {
            logger.error('CLAUDE_API_KEY is missing from process.env');
            throw new Error('CLAUDE_API_KEY is not defined in environment variables');
        }

        logger.info(`Generating summary with Claude. API Key length: ${apiKey.length}`);
        
        const anthropic = new Anthropic({
            apiKey: apiKey.trim(),
        });

        const prompt = `You are a senior Irish tax consultant preparing a formal document summary for a client file. Analyze the following tax document and produce a highly professional, plain-text summary report.
STRICT FORMATTING RULES:
- Do NOT use any Markdown symbols (no *, **, #, ##, ###, -, backticks, or underscores)
- Do NOT use bullet points of any kind
- Use clean section headings in ALL CAPS
- Separate each section with a blank line
- Use clean label-value formatting like: "Gross Income: €00,000.00"
- Do not include any introductory or closing conversational text

Use exactly this structure:

TAX DOCUMENT SUMMARY

Document Type: [value]
Tax Year: [value]
Prepared By: TaxMind Automated Analysis

INCOME AND TAX DETAILS

Gross Income: [value]
Taxable Income: [value]
PAYE Deducted: [value]
USC Deducted: [value]
Total Tax Paid: [value]

FINAL ASSESSMENT

Assessment Result: [Refund / Underpayment / Balanced]
Amount: [value]
Payment Method: [value or Not Specified]

 KEY ALLOWANCES AND TAX CREDITS
[List each credit/allowance on its own line as: Credit Name: €amount]

 NOTES AND OBSERVATIONS
[Write 2-4 full professional sentences covering any adjustments, anomalies, masked data, income sources, or amendment status. No bullet points.]

If any value cannot be determined from the document, write "Not Specified". If PPS Number is masked, note it as expected per data privacy compliance. Maintain a formal, neutral, client-ready tone throughout.

Document Text to Summarize:
${text}`;

        logger.info('Sending prompt to Claude...');
        
        const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-0',
            max_tokens: 2048,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        });

        const resultText = message.content
            .filter(c => c.type === 'text')
            .map(c => (c as any).text)
            .join('\n');

        logger.info('Claude summary generated successfully');
        return resultText;
    } catch (error: any) {
        logger.error('Claude Summary Generation Error', error);
        const errorMessage = error.message || 'Failed to generate automated summary';
        throw new Error(errorMessage);
    }
};
