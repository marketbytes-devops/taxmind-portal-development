import { customType } from 'drizzle-orm/pg-core';

import { decrypt, encrypt } from '@/utils/crypto';

export const customEncryptedType = <TData>(pgType: string, columnName: string) =>
  customType<{
    data: TData;
    driverData: string;
  }>({
    dataType() {
      return pgType;
    },
    toDriver(value: TData): string {
      return encrypt(JSON.stringify(value));
    },
    fromDriver(value: string): TData {
      // Defensive handling: some rows in the DB might be null, plain JSON,
      // or encrypted with a different/old scheme. Don't let a single bad
      // value throw and crash the entire query mapping.
      if (value === null || value === undefined) {
        return null as unknown as TData;
      }

      // Try decrypting first (expected path)
      try {
        const decrypted = decrypt(value);
        return JSON.parse(decrypted);
      } catch {
        // If decryption fails (wrong format, tampered data, old scheme),
        // try parsing the raw value as JSON (maybe it was stored unencrypted)
        try {
          return JSON.parse(value as unknown as string);
        } catch {
          // As a last resort, return null to avoid failing the whole query.
          // The caller should handle nulls appropriately.
          return null as unknown as TData;
        }
      }
    },
  })(columnName);
