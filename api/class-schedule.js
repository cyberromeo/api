/**
 * Serverless API Endpoint for Class Schedule (Delegates to unified handler)
 * GET /api/class-schedule
 * POST /api/class-schedule
 */

import scheduleHandler from './schedule.js';

export default async function handler(req, res) {
  if (req.method === 'POST' && req.body && Array.isArray(req.body.classes)) {
    return scheduleHandler(req, res);
  }
  if (req.method === 'POST' && req.body && Array.isArray(req.body)) {
    req.body = { classes: req.body };
    return scheduleHandler(req, res);
  }
  return scheduleHandler(req, res);
}
