// Clean and normalize zod-validation-error output into a concise, readable one-liner
export const prettifyZodMessage = (raw: string): string => {
  let msg = String(raw || '').trim();

  // Drop generic prefix
  msg = msg.replace(/^Validation error:\s*/i, '');

  // Extract path:  at "body.field.nested"
  const pathMatch = msg.match(/\s+at\s+"([^"]+)"/i);
  const path = pathMatch?.[1];
  if (path) msg = msg.replace(/\s+at\s+"[^"]+"/i, '');

  // Normalize lists like: expected one of "a"|"b"|"c" -> expected one of: a, b, c
  if (/expected\s+one\s+of/i.test(msg)) {
    const values = [...msg.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (values.length > 0) {
      msg = msg.replace(/expected\s+one\s+of.*$/i, `expected one of: ${values.join(', ')}`);
    }
  }

  // Compact whitespace and ensure trailing period
  msg = msg.replace(/\s+/g, ' ').trim();
  if (!/[.!?]$/.test(msg)) msg += '.';

  // Don't prepend path to keep error messages clean
  // if (path) msg = `${path}: ${msg}`;

  return msg;
};
