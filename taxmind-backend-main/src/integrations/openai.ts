import OpenAI from 'openai';
import logger from '../logger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PDFParse } = require('pdf-parse');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: `You are a professional tax consultant assistant. Your task is to provide a concise and structured summary of a tax receipt or tax document from a government portal. 
          Extract key information such as:
          - Document Type (e.g., P21 Balancing Statement, Statement of Liability, etc.)
          - Tax Year
          - Total Income
          - Tax Paid
          - Tax Refund/Liability Amount
          - Key allowances mentioned
          
          Format the summary clearly using bullet points. Be accurate and professional. If information is missing or unclear due to masking, state it clearly.`,
                },
                {
                    role: 'user',
                    content: `Please summarize the following tax document text:\n\n${text}`,
                },
            ],
            temperature: 0.3,
        });

        return response.choices[0].message?.content || 'Unabled to generate summary';
    } catch (error: any) {
        logger.error('OpenAI Summary Generation Error', error);
        // Propagate specific OpenAI error messages (like Quota Exceeded)
        const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to generate automated summary';
        throw new Error(errorMessage);
    }
};
