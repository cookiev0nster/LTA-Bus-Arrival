import type { Request, Response } from 'express';

/**
 * Health check endpoint for serverless deployment
 * GET /api/health
 */
export default async function handler(req: Request, res: Response) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ltaKeyConfigured = Boolean(
    process.env.LTA_ACCOUNT_KEY || process.env.LTA_API_KEY
  );

  return res.status(200).json({
    status: 'healthy',
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    timestamp: new Date().toISOString(),
    service: 'SG Bus LTA Datamall Gateway',
    environment: {
      ltaAccountKeyConfigured: ltaKeyConfigured,
      nodeVersion: process.version,
    },
  });
}
