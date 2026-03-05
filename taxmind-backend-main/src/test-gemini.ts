import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function testGemini() {
    const logFile = path.join(__dirname, '../gemini-test-results.txt');
    const log = (msg: string) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };

    fs.writeFileSync(logFile, 'Starting Gemini Test\n');

    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey) {
        log('GEMINI_API_KEY not found');
        return;
    }
    log('API Key length: ' + apiKey.length);
    const genAI = new GoogleGenerativeAI(apiKey);

    const modelsToTry = [
        'gemini-flash-latest',
        'gemini-2.5-flash',
        'gemini-3.1-flash-lite-preview'
    ];

    for (const modelName of modelsToTry) {
        try {
            log(`Attempting model: ${modelName}...`);
            // Some versions require the 'models/' prefix
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('Hi');
            log(`✅ Success with ${modelName}: ` + result.response.text().substring(0, 50));
            break;
        } catch (error: any) {
            log(`❌ Failed with ${modelName}: ` + (error.message || error));

            // Try with 'models/' prefix
            try {
                log(`Attempting model: models/${modelName}...`);
                const model = genAI.getGenerativeModel({ model: `models/${modelName}` });
                const result = await model.generateContent('Hi');
                log(`✅ Success with models/${modelName}: ` + result.response.text().substring(0, 50));
                break;
            } catch (error2: any) {
                log(`❌ Failed with models/${modelName}: ` + (error2.message || error2));
            }
        }
    }
    log('Test Finished');
}

testGemini();
