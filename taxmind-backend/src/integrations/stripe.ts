import { Request } from 'express';
import Stripe from 'stripe';

import logger from '@/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

export const getWebhookEvents = (
  signature: string,
  body: Request['body'],
  webhookSecret: string
) => {
  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logger.info(`⚠️  Webhook signature verification success.`);
    return { event, error: null };
  } catch (error) {
    logger.error(`⚠️  Webhook signature verification failed: ${(error as Error).message}`);
    return { event: null, error: (error as Error).message };
  }
};

type TCreatePaymentIntent = {
  user: { name: string; email: string };
  metadata: Stripe.MetadataParam;
  amount: number;
};
export const createPaymentIntent = async ({ user, metadata, amount }: TCreatePaymentIntent) => {
  let stripeCustomer;

  const stripeCustomerExists = await stripe.customers.list({
    email: user.email,
  });

  // if not, create a new stripe customer
  if (!stripeCustomerExists.data.length)
    stripeCustomer = await stripe.customers.create({
      name: user.name,
      email: user.email,
    });
  else stripeCustomer = stripeCustomerExists.data[0];

  const ephemeralKey = await stripe.ephemeralKeys.create(
    { customer: stripeCustomer.id },
    { apiVersion: '2024-04-10' }
  );

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount,
    currency: 'usd',
    customer: stripeCustomer.id,
    // payment_method_types: ["card", "link"],
    metadata,
  });

  return {
    paymentIntent: paymentIntent.client_secret,
    ephemeralKey: ephemeralKey.secret,
    customer: stripeCustomer.id,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  };
};

type TCreateProduct = {
  name: string;
  description: string;
  price: number;
  metadata: Stripe.MetadataParam;
};
export const createProductInStripe = async ({
  name,
  description,
  price,
  metadata,
}: TCreateProduct) => {
  const product = await stripe.products.create({
    name,
    description,
    metadata,
  });

  const productPrice = await stripe.prices.create({
    unit_amount: price, // Amount in cents
    currency: 'usd',
    product: product.id,
  });

  // console.log(product, productPrice);

  return {
    product,
    productPrice,
  };
};

type TPurchaseProduct = {
  user: { name: string; email: string };
  metadata: Stripe.MetadataParam;
  productId: string;
};
export const purchaseProduct = async ({ user, productId, metadata }: TPurchaseProduct) => {
  try {
    let stripeCustomer;

    const stripeCustomerExists = await stripe.customers.list({
      email: user.email,
    });

    // if not, create a new stripe customer
    if (!stripeCustomerExists.data.length)
      stripeCustomer = await stripe.customers.create({
        name: user.name,
        email: user.email,
      });
    else stripeCustomer = stripeCustomerExists.data[0];

    const products = await stripe.products.search({
      query: `active:'true' AND metadata['productId']:'${productId}'`,
      limit: 1,
    });

    if (products.data.length === 0) throw new Error('Product not found');

    const prices = await stripe.prices.list({
      product: products.data[0].id,
      active: true,
      limit: 1,
    });

    if (prices.data.length === 0) throw new Error('Product price not found');

    const productPrice = prices.data[0];

    const paymentIntent = await stripe.paymentIntents.create({
      amount: productPrice.unit_amount as number,
      currency: productPrice.currency,
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      metadata: {
        stripeProductId: products.data[0].id,
        productId,
        ...metadata,
      },
      //   description: `Purchase of ${product.name}`,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: stripeCustomer.id },
      { apiVersion: '2024-04-10' }
    );

    return {
      paymentIntent,
      customer: stripeCustomer,
      ephemeralKey,
      product: products.data[0],
      productPrice: prices.data[0],
    };
  } catch (error) {
    console.error('Error processing purchase:', error);
    throw new Error('Failed to process purchase');
  }
};

export const checkPaymentIntentStatus = async (paymentIntentId: string) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const status = paymentIntent.status;
    // console.log(`Payment Intent Status: ${status}`);
    return status;
  } catch (error) {
    logger.error(`Error retrieving payment intent: ${(error as Error).message}`);
    throw new Error('Unable to fetch payment intent status');
  }
};
