import * as crypto from 'crypto';

import defaults from '../default';

// const key = crypto.randomBytes(32);
// console.log("Generated Key:", key.toString('hex'))

// const key1 = crypto.randomBytes(16);
// console.log("Generated Key1:", key1.toString('hex'))

const algorithm = 'aes-256-cbc';
const initVector = Buffer.from(process.env.CRYPTO_IV || defaults.CRYPTO_IV, 'hex');
const securityKey = Buffer.from(process.env.CRYPTO_KEY || defaults.CRYPTO_KEY, 'hex');

// Type definitions
type EncryptableValue = string | EncryptableObject | EncryptableArray;
type EncryptableObject = { [key: string]: string };
type EncryptableArray = (string | EncryptableObject)[];

// Encrypt data
export function encrypt(text: EncryptableValue): EncryptableValue {
  // console.log("encrypting: ", text)
  try {
    // console.log("typeof ",text,": ", typeof text)
    if (Array.isArray(text)) {
      const textCopy = JSON.parse(JSON.stringify(text)) as EncryptableArray;
      return textCopy.map((x) => {
        // console.log("typeof1 ",x,": ", typeof x)
        if (typeof x === 'object' && x !== null) {
          const obj = { ...x };
          for (const key in obj) {
            // console.log(key, obj[key]);
            const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);
            let encryptedData = cipher.update(obj[key], 'utf-8', 'hex');
            encryptedData += cipher.final('hex');
            // console.log("ok");
            obj[key] = encryptedData;
          }
          return obj;
        } else {
          const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);
          let encryptedData = cipher.update(x as string, 'utf-8', 'hex');
          encryptedData += cipher.final('hex');
          // console.log("ok");
          return encryptedData;
        }
      });
      // console.log("Text: ", text)
    } else if (typeof text === 'object' && text !== null) {
      const obj = { ...text };
      for (const key in obj) {
        const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);
        let encryptedData = cipher.update(obj[key], 'utf-8', 'hex');
        encryptedData += cipher.final('hex');
        obj[key] = encryptedData;
      }
      return obj;
    } else {
      const cipher = crypto.createCipheriv(algorithm, securityKey, initVector);
      let encryptedData = cipher.update(text as string, 'utf-8', 'hex');
      encryptedData += cipher.final('hex');
      // console.log("ok");
      return encryptedData;
    }
  } catch {
    // console.log("encrypt text: ", text);
    console.error('encrypt error: ' /* , ex */);
    return text;
  }
}

// Decrypt data
export function decrypt(
  text: EncryptableValue | null | undefined
): EncryptableValue | null | undefined {
  // console.log("decrypting: ", text)
  try {
    if (text === null || typeof text === 'undefined') {
      /* console.log("null1"); */ return text;
    }
    // console.log("typeof ",text,": ", typeof text)
    if (Array.isArray(text)) {
      const textCopy = JSON.parse(JSON.stringify(text)) as EncryptableArray;
      return textCopy.map((x) => {
        // console.log("typeof1 ",x,": ", typeof x)
        if (typeof x === 'object' && x !== null) {
          const obj = { ...x };
          for (const key in obj) {
            // console.log("key: ",key, obj[key]);
            if (key !== '_id') {
              const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
              let decryptedData = decipher.update(obj[key], 'hex', 'utf-8');
              decryptedData += decipher.final('utf8');
              // console.log("ok");
              obj[key] = decryptedData;
            }
          }
          return obj;
        } else {
          // console.log("typeof2 ",x,": ", typeof x)
          const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
          let decryptedData = decipher.update(x as string, 'hex', 'utf-8');
          decryptedData += decipher.final('utf8');
          // console.log("ok");
          return decryptedData;
        }
      });
      // console.log("Text: ", text)
    } else if (typeof text === 'object' && text !== null) {
      const obj = { ...text };
      for (const key in obj) {
        if (key !== '_id') {
          const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
          let decryptedData = decipher.update(obj[key], 'hex', 'utf-8');
          decryptedData += decipher.final('utf8');
          obj[key] = decryptedData;
        }
      }
      return obj;
    } else {
      const decipher = crypto.createDecipheriv(algorithm, securityKey, initVector);
      let decryptedData = decipher.update(text as string, 'hex', 'utf-8');
      decryptedData += decipher.final('utf8');
      // console.log("ok");
      return decryptedData;
    }
  } catch {
    // console.log("decrypt text: ", text);
    console.error('decrypt error: ' /* , ex */);
    return text;
  }
}
