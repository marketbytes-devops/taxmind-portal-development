import { NextFunction, Request, Response } from 'express';

// Production and sandbox IPs provided by Revolut (update if docs change)
const PROD_IPS = new Set(['35.246.21.235', '34.89.70.170']);
const SANDBOX_IPS = new Set(['35.242.130.242', '35.242.162.241']);

// Helper to extract originating IP from headers (behind proxies / tunnels)
function extractSourceIp(req: Request): string | null {
  const headerCandidates = ['x-real-ip', 'x-forwarded-for', 'x-client-ip', 'cf-connecting-ip'];
  for (const h of headerCandidates) {
    const val = req.headers[h] as string | undefined;
    if (val) {
      // x-forwarded-for may contain a list
      const first = val.split(',')[0].trim();
      if (first) return first;
    }
  }
  // Fallback to req.ip (may contain ::ffff: prefix)
  if (req.ip) return req.ip.replace('::ffff:', '');
  return null;
}

export function revolutIpAllowlist(req: Request, res: Response, next: NextFunction) {
  if (process.env.DISABLE_REVOLUT_IP_CHECK === 'true') return next();

  const mode = (process.env.REVOLUT_ENV || 'sandbox').toLowerCase();
  const allowed = mode === 'production' ? PROD_IPS : SANDBOX_IPS;
  const sourceIp = extractSourceIp(req);

  if (!sourceIp) {
    return res.status(403).json({ message: 'Forbidden (missing source IP)' });
  }

  if (!allowed.has(sourceIp)) {
    return res.status(403).json({ message: 'Forbidden (IP not allowed)', ip: sourceIp });
  }

  return next();
}
