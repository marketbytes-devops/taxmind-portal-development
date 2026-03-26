import axios from 'axios';

import ApiError from '@/utils/apiError';

const {
  NODE_ENV,
  ZOHO_CLIENT_ID,
  ZOHO_CLIENT_SECRET,
  ZOHO_AUTHORIZED_REDIRECT_URL,
  ZOHO_ACCOUNTS_URL,
  ZOHO_SIGN_URL,
  ZOHO_REFRESH_TOKEN,
  ZOHO_TEMPORARY_ACCESS_TOKEN,
  ZOHO_TEMPLATE_ID,
} = process.env;

export type ZohoTokenResponse = {
  access_token: string;
  api_domain: string;
  token_type: string;
  expires_in: number;
};

export async function generateZohoAccessToken(): Promise<ZohoTokenResponse> {
  const form = new URLSearchParams();
  form.append('grant_type', 'refresh_token');
  form.append('client_id', ZOHO_CLIENT_ID);
  form.append('client_secret', ZOHO_CLIENT_SECRET);
  form.append('redirect_uri', ZOHO_AUTHORIZED_REDIRECT_URL);
  form.append('refresh_token', ZOHO_REFRESH_TOKEN);

  try {
    const response = await axios.post<ZohoTokenResponse>(ZOHO_ACCOUNTS_URL, form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    console.log(response);
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err)) {
      console.log(err);
      throw new Error(
        `Zoho token exchange failed: ${err.response?.status} ${JSON.stringify(err.response?.data)}`
      );
    }
    throw err as Error;
  }
}

type User = {
  name: string;
  email: string;
};

export async function sendSignatureRequest(user: User) {
  const formData = new FormData();
  const templateData = {
    templates: {
      actions: [
        {
          action_type: 'SIGN',
          recipient_email: user.email,
          recipient_name: user.name,
          action_id: '95577000000046026',
          verify_recipient: 'false',
          role: 'Signer',
        },
      ],
      notes: 'Sign this TaxMind Account Creation Consent doc',
    },
  };

  try {
    formData.append('data', JSON.stringify(templateData));
    formData.append('is_quicksend', 'true');

    const ACCESS_TOKEN =
      NODE_ENV === 'local'
        ? ZOHO_TEMPORARY_ACCESS_TOKEN
        : (await generateZohoAccessToken()).access_token;

    const res = await axios.post(
      `${ZOHO_SIGN_URL}/templates/${ZOHO_TEMPLATE_ID}/createdocument`,
      formData,
      {
        headers: { Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}` },
      }
    );

    return res.data;
  } catch (error) {
    console.error('Error sending Zoho signature request:', error);
    throw new ApiError('Failed to send signature consent request');
  }
}

export async function listTemplates() {
  try {
    const ACCESS_TOKEN =
      NODE_ENV === 'local'
        ? ZOHO_TEMPORARY_ACCESS_TOKEN
        : (await generateZohoAccessToken()).access_token;

    const res = await axios.get(`${ZOHO_SIGN_URL}/templates`, {
      headers: { Authorization: `Zoho-oauthtoken ${ACCESS_TOKEN}` },
    });
    console.log(true, res.data);
    return res.data;
  } catch (error) {
    console.error('Error listing Zoho templates:', error);
    throw new Error('Failed to list Zoho templates');
  }
}
