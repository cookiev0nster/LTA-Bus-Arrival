import type { Request, Response } from 'express';

/**
 * Serverless API endpoint to fetch real-time Singapore LTA DataMall bus arrivals
 *
 * GET /api/busarrival?BusStopCode=83139
 * Optional: &ServiceNo=15
 *
 * Upstream LTA DataMall:
 * GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
 * Headers:
 *   AccountKey: <LTA_ACCOUNT_KEY>
 *   accept: application/json
 */
export default async function handler(req: Request, res: Response) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only GET requests are supported',
    });
  }

  // Extract BusStopCode and optional ServiceNo from query
  const busStopCode = (
    req.query.BusStopCode ||
    req.query.busStopCode ||
    req.query.code ||
    ''
  ).toString().trim();

  const serviceNo = (
    req.query.ServiceNo ||
    req.query.serviceNo ||
    ''
  ).toString().trim();

  if (!busStopCode) {
    return res.status(400).json({
      error: 'Missing Required Parameter',
      message: 'Please provide BusStopCode in query parameters (e.g. /api/busarrival?BusStopCode=83139)',
    });
  }

  // Retrieve LTA AccountKey from environment variables
  const ltaAccountKey = process.env.LTA_ACCOUNT_KEY || process.env.LTA_API_KEY;

  if (!ltaAccountKey) {
    return res.status(503).json({
      error: 'LTA_ACCOUNT_KEY_NOT_CONFIGURED',
      message:
        'LTA Datamall AccountKey is not configured on the server. Please set the LTA_ACCOUNT_KEY environment variable in your deployment settings or .env file.',
      busStopCode,
      hint: 'Sign up at https://datamall.lta.gov.sg/ to obtain your free AccountKey.',
    });
  }

  try {
    const url = new URL('https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival');
    url.searchParams.set('BusStopCode', busStopCode);
    if (serviceNo) {
      url.searchParams.set('ServiceNo', serviceNo);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        AccountKey: ltaAccountKey,
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Upstream LTA Datamall error (${response.status})`,
        status: response.status,
        details: errorText,
      });
    }

    const data = await response.json();

    return res.status(200).json({
      ...data,
      isLive: true,
      retrievedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      error: 'Failed to fetch from LTA Datamall',
      details: errorMessage,
    });
  }
}
