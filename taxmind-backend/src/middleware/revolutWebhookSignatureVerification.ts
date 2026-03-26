import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';

import ApiError from '@/utils/apiError';

/**
 * Middleware to verify Revolut webhook signature
 * Documentation: https://developer.revolut.com/docs/guides/accept-payments/tutorials/work-with-webhooks/verify-the-payload-signature
 */
export const revolutWebhookSignatureVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const signingSecret = process.env.REVOLUT_WEBHOOK_SIGNING_SECRET;

    if (!signingSecret) {
      throw new ApiError('Revolut webhook signing secret not configured', 500);
    }

    // Get headers
    const revolutSignature = req.headers['revolut-signature'] as string;
    const revolutTimestamp = req.headers['revolut-request-timestamp'] as string;

    if (!revolutSignature || !revolutTimestamp) {
      throw new ApiError('Missing required Revolut webhook headers', 400);
    }

    // Validate timestamp (within 5 minutes tolerance)
    const now = Date.now();
    const webhookTimestamp = parseInt(revolutTimestamp);
    const timeDifference = Math.abs(now - webhookTimestamp);
    const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (timeDifference > fiveMinutesInMs) {
      throw new ApiError('Webhook timestamp is outside acceptable time window', 400);
    }

    // Get raw body - the webhook URL is configured for raw body parsing in app.ts
    let rawBody: string;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    // Step 1: Prepare payload to sign
    // Format: {version}.{timestamp}.{raw-payload}
    const version = 'v1';
    const payloadToSign = `${version}.${revolutTimestamp}.${rawBody}`;

    // Step 2: Compute expected signature
    const hmac = crypto.createHmac('sha256', signingSecret);
    hmac.update(payloadToSign, 'utf8');
    const computedSignature = `v1=${hmac.digest('hex')}`;

    // Step 3: Compare signatures
    // Handle multiple signatures (comma-separated) in case of key rotation
    const signatures = revolutSignature.split(',').map((sig) => sig.trim());

    let isValidSignature = false;
    for (const signature of signatures) {
      if (
        crypto.timingSafeEqual(
          Buffer.from(computedSignature, 'utf8'),
          Buffer.from(signature, 'utf8')
        )
      ) {
        isValidSignature = true;
        break;
      }
    }

    if (!isValidSignature) {
      throw new ApiError('Invalid webhook signature', 401);
    }

    // Parse the JSON body for downstream middleware since we received it as raw buffer
    if (Buffer.isBuffer(req.body)) {
      try {
        req.body = JSON.parse(rawBody);
      } catch {
        throw new ApiError('Invalid JSON in webhook payload', 400);
      }
    }

    // Signature is valid, proceed to next middleware
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode()).json({
        success: false,
        message: error.message,
      });
    }

    console.error('Webhook signature verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during webhook verification',
    });
  }
};
