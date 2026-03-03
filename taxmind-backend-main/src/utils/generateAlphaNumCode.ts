import { customAlphabet } from 'nanoid';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const nanoid = customAlphabet(alphabet, 21);

export const generateAlphaNumCode = () => nanoid();
