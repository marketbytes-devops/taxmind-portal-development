import { GoogleGenerativeAI } from '@google/generative-ai';
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
        const apiKey = process.env.GEMINI_API_KEY || '';
        if (!apiKey) {
            logger.error('GEMINI_API_KEY is missing from process.env');
            throw new Error('GEMINI_API_KEY is not defined in environment variables');
        }

        logger.info(`Generating summary with Gemini. API Key length: ${apiKey.length}`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

        const prompt = `You are a professional tax consultant assistant. Your task is to provide a concise and structured summary of a tax receipt or tax document from a government portal. 
Extract key information such as:
- Document Type (e.g., P21 Balancing Statement, Statement of Liability, etc.)
- Tax Year
- Total Income
- Tax Paid
- Tax Refund/Liability Amount
- Key allowances mentioned

Format the summary clearly using bullet points. Be accurate and professional. If information is missing or unclear due to masking, state it clearly.

Please summarize the following tax document text:\n\n${text}`;

        logger.info('Sending prompt to Gemini...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const resultText = response.text();
        logger.info('Gemini summary generated successfully');
        return resultText;
    } catch (error: any) {
        logger.error('Gemini Summary Generation Error', error);
        const errorMessage = error.message || 'Failed to generate automated summary';
        throw new Error(errorMessage);
    }
};
