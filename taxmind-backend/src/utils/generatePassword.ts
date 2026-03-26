import { randomBytes } from 'crypto';

// Generate a random password of 12 characters
export const generatePassword = (length: number = 12) =>
  randomBytes(length).toString('base64').slice(0, length);
