/**
 * Cronicle Job Setup Script for OpenCode AI Usage Telemetry
 * Registers/Updates event on http://umbrel.local:3012
 * Schedule: Every 15 minutes (Minutes 0, 15, 30, 45 across all hours)
 */

const axios = require('axios');

const CRONICLE_URL = process.env.CRONICLE_URL || 'http://umbrel.local:3012';
const CRONICLE_API_KEY = process.env.CRONICLE_API_KEY || 'ba768ce3fa7125fa071a5e2d62110bd7';

const ACTIVE_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0];
// Minutes 25, 55 of 6 AM to 12 AM
const INTERVAL_MINUTES = [25, 55];




// Self-contained inline Node.js script using native fetch
const inlineScriptContent = `#!/usr/bin/env node

const WORKSPACE_URL = "https://opencode.ai/workspace/wrk_01KWYHQ06WTW00CA0RFP7AK07Q/go";
const COOKIE = "ext_name=98B976E3G5; auth=Fe26.2**5c4e58cbb87e1a05432606c6475c01df150b6529c2c899685d144470b3472fb5*UiO8lkkP_TsACQVY2JEh0g*6A6vZGC-H3VZXyKewl6n9qY0e43bkEg3ts8HRrWpaOQfrCIyCYq4emxTfO7haUxNE_heiQy5mCuTcx2V4UhgeLgyLisGtuXK5vnzatMVC7O26ce_II1GCdFkt7wqmlE9XOPp8IhAF55fXSeyfjl4L2kBmUlzc6NncNpTsSz_cf1YOyG_Xpn_FJTxRLCM-XNKMYrl5qYL8WwAYVkK3hzBWXRCw4SrkKPKhh7gVA04DV0MzV8UieKT_Zt59bHrHTsDDTakC_BsmTxKPnElxZmRelpYnLbWEWpiFulj4YaFfkiAHHEau5HQZcnkoAbtM2zjB6HSSQLh0-Oa4NMEZ0qnbQ*1815995064814*27a8f7f129c64a04949d1a4245c182ed4b514c288cc87a5b67609e3c9f6d2c55*pjeXaqM9_bQI3daohjmi60ukKlIhCwzqKE-nCK77mVY; desktop_promo_dismissed=1; oc_locale=en";

const headers = {
  "Host": "opencode.ai",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1",
  "Cookie": COOKIE
};

function parseUsageSection(htmlText) {
  const result = {
    rolling: { label: "Rolling Usage (5h)", percentage: 0, resetIn: "N/A" },
    weekly: { label: "Weekly Usage", percentage: 0, resetIn: "N/A" },
    monthly: { label: "Monthly Usage", percentage: 0, resetIn: "N/A" }
  };

  try {
    const items = htmlText.split('data-slot="usage-item"');
    items.forEach(item => {
      if (item.includes('Rolling Usage')) {
        const valMatch = item.match(/usage-value">.*?(\\d+)%/);
        const resetMatch = item.match(/Resets in[\\s\\S]*?<!--\\$-->([\\s\\S]*?)<!--\\/-->/);
        if (valMatch) result.rolling.percentage = parseInt(valMatch[1], 10);
        if (resetMatch) result.rolling.resetIn = resetMatch[1].trim();
      } else if (item.includes('Weekly Usage')) {
        const valMatch = item.match(/usage-value">.*?(\\d+)%/);
        const resetMatch = item.match(/Resets in[\\s\\S]*?<!--\\$-->([\\s\\S]*?)<!--\\/-->/);
        if (valMatch) result.weekly.percentage = parseInt(valMatch[1], 10);
        if (resetMatch) result.weekly.resetIn = resetMatch[1].trim();
      } else if (item.includes('Monthly Usage')) {
        const valMatch = item.match(/usage-value">.*?(\\d+)%/);
        const resetMatch = item.match(/Resets in[\\s\\S]*?<!--\\$-->([\\s\\S]*?)<!--\\/-->/);
        if (valMatch) result.monthly.percentage = parseInt(valMatch[1], 10);
        if (resetMatch) result.monthly.resetIn = resetMatch[1].trim();
      }
    });
  } catch (err) {
    console.error("Parse warning:", err.message);
  }
  return result;
}

async function run() {
  const now = new Date();
  console.log("📡 Fetching OpenCode AI Usage Telemetry...");

  const res = await fetch(WORKSPACE_URL, { headers });
  const html = await res.text();
  const usageData = parseUsageSection(html);

  console.log("📊 OpenCode AI Limits Parsed:", JSON.stringify(usageData));

  // Direct Firestore REST API Update
  const firestoreUrl = "https://firestore.googleapis.com/v1/projects/epaper-api-key/databases/(default)/documents/api_feeds/ai_usage_metrics";
  
  const patchData = {
    fields: {
      apiName: { stringValue: "AI_USAGE" },
      source: { stringValue: "OpenCode AI Worker" },
      timestamp: { timestampValue: now.toISOString() },
      status: { stringValue: "success" },
      payload: {
        mapValue: {
          fields: {
            provider: { stringValue: "OpenCode AI Go" },
            lastUpdated: { stringValue: now.toISOString() },
            summary: {
              mapValue: {
                fields: {
                  rolling: {
                    mapValue: {
                      fields: {
                        percentage: { integerValue: usageData.rolling.percentage },
                        resetIn: { stringValue: usageData.rolling.resetIn }
                      }
                    }
                  },
                  weekly: {
                    mapValue: {
                      fields: {
                        percentage: { integerValue: usageData.weekly.percentage },
                        resetIn: { stringValue: usageData.weekly.resetIn }
                      }
                    }
                  },
                  monthly: {
                    mapValue: {
                      fields: {
                        percentage: { integerValue: usageData.monthly.percentage },
                        resetIn: { stringValue: usageData.monthly.resetIn }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const fsRes = await fetch(firestoreUrl, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patchData)
  });

  if (fsRes.ok) {
    console.log("✅ Successfully updated Firestore document 'api_feeds/ai_usage_metrics'");
  } else {
    const errText = await fsRes.text();
    console.error("❌ Firestore API Error:", fsRes.status, errText);
    process.exit(1);
  }
}

run().catch(err => {
  console.error("❌ Execution Error:", err);
  process.exit(1);
});
`;

async function updateCronicleAiJob() {
  const updateUrl = `${CRONICLE_URL}/api/app/update_event/v1?api_key=${CRONICLE_API_KEY}`;

  const eventPayload = {
    id: "ems1g98le07",
    title: "AI Usage Telemetry Sync",
    enabled: 1,
    category: "general",
    target: "allgrp",
    algo: "random",
    plugin: "shellplug",
    timing: {
      hours: ACTIVE_HOURS,
      minutes: INTERVAL_MINUTES
    },
    params: {
      script: inlineScriptContent
    },
    notes: "Self-contained inline script fetching OpenCode AI Usage limits (5h rolling, weekly, monthly & reset times) every 15 minutes."
  };

  console.log(`📡 Updating Cronicle event 'ems1g98le07' on ${CRONICLE_URL}...`);

  try {
    const response = await axios.post(updateUrl, eventPayload);
    const data = response.data;

    if (data.code === 0) {
      console.log(`✅ Cronicle AI Event updated successfully!`);
    } else {
      console.warn(`⚠️ Cronicle update response:`, data);
    }
  } catch (error) {
    console.error(`❌ Cronicle setup error:`, error.response ? error.response.data : error.message);
  }
}

updateCronicleAiJob();
