/**
 * Cronicle API Client Service
 * Interacts with Cronicle running on http://umbrel.local:3012
 */

export const CRONICLE_URL = import.meta.env.VITE_CRONICLE_URL || 'http://umbrel.local:3012';
export const CRONICLE_API_KEY = import.meta.env.VITE_CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

/**
 * Trigger an event manually on Cronicle via REST API
 * POST http://umbrel.local:3012/api/app/run_event/v1?api_key=KEY
 */
export const runCronicleEvent = async (eventTitleOrId, options = {}) => {
  const targetUrl = `${CRONICLE_URL}/api/app/run_event/v1?api_key=${CRONICLE_API_KEY}`;
  
  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: eventTitleOrId,
        id: eventTitleOrId,
        params: options
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Cronicle API request error:", error);
    throw error;
  }
};

/**
 * Get active scheduled events from Cronicle
 * GET http://umbrel.local:3012/api/app/get_schedule/v1?api_key=KEY
 */
export const getCronicleSchedule = async () => {
  const targetUrl = `${CRONICLE_URL}/api/app/get_schedule/v1?api_key=${CRONICLE_API_KEY}`;
  
  try {
    const response = await fetch(targetUrl);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Unable to fetch Cronicle schedule (likely CORS or offline):", error);
    return { code: 0, rows: [] };
  }
};
