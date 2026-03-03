import crypto from 'crypto';

export function verifyHmacHash(secretKey: string, payload: string, hmacHash: string): boolean {
  const calculatedHmac = crypto
    .createHmac('sha256', secretKey)
    .update(payload, 'utf8')
    .digest('base64');

  if (calculatedHmac === hmacHash) {
    console.log('Hashes match, Webhook payload is valid!!');
  } else {
    console.log("Hashes doesn't match, Webhook payload is tampered!!");
  }

  return calculatedHmac === hmacHash;
}
