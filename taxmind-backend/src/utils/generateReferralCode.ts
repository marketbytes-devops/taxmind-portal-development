import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const nanoid = customAlphabet(alphabet, 12);

export const generateReferralCode = () => nanoid();
