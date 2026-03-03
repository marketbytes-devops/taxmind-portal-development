import axios from 'axios';

const REVOLUT_API = process.env.REVOLUT_API!;

export type RevolutCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  dob?: string;
};

export type RevolutCustomerResponse = {
  id: string;
  full_name: string;
  business_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
};

export type CreateOrderParams = {
  amount: number; // minor units
  currency?: string;
  customer: RevolutCustomerPayload;
  application: {
    id: string;
    applicationNo?: string | null;
    year: number;
    commissionPercentage?: string | null;
    commissionAmount?: string | null;
    vatPercentage?: string | null;
    vatAmount?: string | null;
    discountAmount?: string | null;
    finalAmount?: string | null;
    isAmendment?: boolean | null;
    refundAmount?: string | null;
    totalCommissionAmount?: string | null;
    flatFee?: string | null;
  };
  userId: string;
  revolutCustomerId: string;
};

export type CreateOrderResponse = {
  id: string;
  token: string;
  type: string;
  state: string;
  created_at: string;
  updated_at: string;
  amount: number;
  currency: string;
  outstanding_amount: number;
  capture_mode: string;
  checkout_url: string;
  enforce_challenge: string;
  metadata: any;
  payments: any[];
};

export async function createCustomer(payload: RevolutCustomerPayload) {
  try {
    // check dob in payload and format it to YYYY-MM-DD
    if (payload.dob) {
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(payload.dob)) {
        const [day, month, year] = payload.dob.split('/');
        payload.dob = `${year}-${month}-${day}`;
      }
    }
    const { data } = await axios.post(
      `${REVOLUT_API}/api/1.0/customers`,
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        date_of_birth: payload.dob,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Revolut-Api-Version': '2024-09-01',
          Authorization: `Bearer ${process.env.REVOLUT_API_SECRET_KEY}`,
        },
      }
    );
    return data as RevolutCustomerResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Revolut API error:', error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error('Error creating Revolut customer:', error.message);
    }
    throw error;
  }
}

export async function getCustomer(customerId: string) {
  try {
    const { data } = await axios.get(`${REVOLUT_API}/api/1.0/customers/${customerId}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Revolut-Api-Version': '2024-09-01',
        Authorization: `Bearer ${process.env.REVOLUT_API_SECRET_KEY}`,
      },
    });
    return data as RevolutCustomerResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Revolut API error:', error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error('Error fetching Revolut customer:', error.message);
    }
    throw error;
  }
}

export async function createOrder({
  amount,
  currency = 'EUR',
  customer,
  application,
  userId,
  revolutCustomerId,
}: CreateOrderParams) {
  try {
    const payload = {
      amount,
      currency,
      capture_mode: 'automatic',
      description: `Application ${application.applicationNo || application.id} payment`,
      customer_id: revolutCustomerId,
      metadata: {
        userId,
        applicationId: application.id,
        applicationNo: application.applicationNo || null,
        year: application.year,
        commissionPercentage: application.commissionPercentage || null,
        commissionAmount: application.commissionAmount || null,
        vatPercentage: application.vatPercentage || null,
        vatAmount: application.vatAmount || null,
        discountAmount: application.discountAmount || null,
        finalAmount: application.finalAmount || null,
        flatFee: application.flatFee || null,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerName: customer.name,
      },
      redirect_url: `${process.env.USER_DASHBOARD_BASE_URL}/application-upload?id=${application.id}`,
      expire_pending_after: 'PT5M',
    };

    const response = await axios.post(`${REVOLUT_API}/api/orders`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Revolut-Api-Version': '2024-09-01',
        Authorization: `Bearer ${process.env.REVOLUT_API_SECRET_KEY}`,
      },
    });

    return response.data as CreateOrderResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error', error);
    }
  }
}

export async function getOrder(orderId: string) {
  try {
    console.log('Fetching order:', orderId);
    const response = await axios.get(`${REVOLUT_API}/api/orders/${orderId}`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Revolut-Api-Version': '2024-09-01',
        Authorization: `Bearer ${process.env.REVOLUT_API_SECRET_KEY}`,
      },
    });

    return response.data as CreateOrderResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(error.response?.data || error.message);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error', error);
    }
  }
}
