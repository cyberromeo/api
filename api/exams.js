/**
 * Serverless API Endpoint for Exams Schedule (Delegates to unified handler)
 * GET /api/exams
 * POST /api/exams
 */

import scheduleHandler from './schedule.js';

export default async function handler(req, res) {
  if (req.method === 'POST' && req.body && Array.isArray(req.body.exams)) {
    return scheduleHandler(req, res);
  }
  if (req.method === 'POST' && req.body && Array.isArray(req.body)) {
    req.body = { exams: req.body };
    return scheduleHandler(req, res);
  }
  return scheduleHandler(req, res);
}
