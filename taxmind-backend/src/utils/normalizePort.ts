export function normalizePort(val: string) {
  const port = parseInt(val, 10);

  // Named pipe
  if (Number.isNaN(port)) return val;

  // Port number
  if (port >= 0) return port;

  return false;
}
