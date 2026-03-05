import logger from '../logger';

const { MAYA_API_BASE_URL, MAYA_API_EMAIL, MAYA_API_PASSWORD, MAYA_PROJECT_ID } = process.env;

let currentJwtToken: string | null = null;
let currentRefreshToken: string | null = null;

export const loginToMaya = async (): Promise<string> => {
    if (currentJwtToken) return currentJwtToken;

    try {
        const response = await fetch(`${MAYA_API_BASE_URL}/mdp/app-safe-idm/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userName: MAYA_API_EMAIL,
                password: MAYA_API_PASSWORD,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.errorMessage || 'Failed to authenticate with Maya API');
        }

        currentJwtToken = data.jwtToken;
        currentRefreshToken = data.refreshToken;

        return currentJwtToken as string;
    } catch (error) {
        logger.error('Maya API Login Error', error);
        throw error;
    }
};

export const anonymizeTaxPDF = async (fileBuffer: Buffer, fileName: string): Promise<string> => {
    const token = await loginToMaya();

    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(fileBuffer)], { type: 'application/pdf' }), fileName);

    const dto = {
        projectId: MAYA_PROJECT_ID,
        runType: 'AI_POWERED',
    };

    formData.append('dto', new Blob([JSON.stringify(dto)], { type: 'application/json' }));

    try {
        const response = await fetch(`${MAYA_API_BASE_URL}/mdp/file-safe/file/anonymize-pdf`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // Note: fetch will automatically calculate Content-Type with boundary for FormData
            },
            body: formData,
        });

        const bodyText = await response.text();
        let data;
        try {
            data = JSON.parse(bodyText);
        } catch (e) {
            throw new Error(`Failed to parse response: ${bodyText}`);
        }

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to submit anonymize task');
        }

        return data.data.requestId;
    } catch (error: any) {
        logger.error('Maya API Anonymize PDF Error', error);
        if (error.message && error.message.includes('Token')) {
            // Simple token expiration resilience 
            currentJwtToken = null;
        }
        throw error;
    }
};

export const getJobStatus = async (requestId: string): Promise<string> => {
    const token = await loginToMaya();

    try {
        const response = await fetch(`${MAYA_API_BASE_URL}/mdp/file-safe/file/get-job-status/${requestId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to get job status');
        }

        return data.data; // Should return NOT_STARTED, ANONYMIZING, FINISHED, FAILED
    } catch (error) {
        logger.error(`Maya API getJobStatus Error for ${requestId}`, error);
        throw error;
    }
};

export const waitForJobCompletion = async (requestId: string, maxAttempts = 30, intervalMs = 5000): Promise<boolean> => {
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        const status = await getJobStatus(requestId);
        if (status === 'FINISHED') return true;
        if (status === 'FAILED') throw new Error('Maya anonymization job failed');

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Maya anonymization job timed out');
};

export const downloadAnonymizedFile = async (requestId: string): Promise<Buffer> => {
    const token = await loginToMaya();

    try {
        const response = await fetch(`${MAYA_API_BASE_URL}/mdp/file-safe/file/download/${requestId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download file: ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (error) {
        logger.error(`Maya API download file error for ${requestId}`, error);
        throw error;
    }
};

export const deleteAnonymizedFile = async (requestId: string): Promise<void> => {
    const token = await loginToMaya();

    try {
        const response = await fetch(`${MAYA_API_BASE_URL}/mdp/file-safe/file/delete-file/${requestId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();

        if (!response.ok && !data.success) {
            throw new Error(data.message || 'Failed to delete file');
        }
    } catch (error) {
        logger.error(`Maya API delete anonymized file error for ${requestId}`, error);
        // Best effort deletion
    }
};
