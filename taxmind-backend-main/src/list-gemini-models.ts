import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function listModels() {
    const logFile = path.join(__dirname, '../gemini-models-list.txt');
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, 'Listing Gemini Models\n');

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
        log('GEMINI_API_KEY not found');
        return;
    }

    // We need to use the REST API to list models because the SDK doesn't expose it easily for API keys sometimes
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        log(JSON.stringify(data, null, 2));
    } catch (error: any) {
        log('Error: ' + error.message);
    }
}

listModels();
