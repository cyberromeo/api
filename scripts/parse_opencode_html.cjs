const axios = require('axios');
const fs = require('fs');

const URL = "https://opencode.ai/workspace/wrk_01KWYHQ06WTW00CA0RFP7AK07Q/go";
const COOKIE = "ext_name=98B976E3G5; auth=Fe26.2**5c4e58cbb87e1a05432606c6475c01df150b6529c2c899685d144470b3472fb5*UiO8lkkP_TsACQVY2JEh0g*6A6vZGC-H3VZXyKewl6n9qY0e43bkEg3ts8HRrWpaOQfrCIyCYq4emxTfO7haUxNE_heiQy5mCuTcx2V4UhgeLgyLisGtuXK5vnzatMVC7O26ce_II1GCdFkt7wqmlE9XOPp8IhAF55fXSeyfjl4L2kBmUlzc6NncNpTsSz_cf1YOyG_Xpn_FJTxRLCM-XNKMYrl5qYL8WwAYVkK3hzBWXRCw4SrkKPKhh7gVA04DV0MzV8UieKT_Zt59bHrHTsDDTakC_BsmTxKPnElxZmRelpYnLbWEWpiFulj4YaFfkiAHHEau5HQZcnkoAbtM2zjB6HSSQLh0-Oa4NMEZ0qnbQ*1815995064814*27a8f7f129c64a04949d1a4245c182ed4b514c288cc87a5b67609e3c9f6d2c55*pjeXaqM9_bQI3daohjmi60ukKlIhCwzqKE-nCK77mVY; desktop_promo_dismissed=1; oc_locale=en";

const HEADERS = {
  "Host": "opencode.ai",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1",
  "Cookie": COOKIE
};

async function parseHtml() {
  try {
    const res = await axios.get(URL, { headers: HEADERS });
    const html = res.data;
    fs.writeFileSync('opencode_page.html', html);
    console.log("Saved page to opencode_page.html (length:", html.length, ")");

    // Search for script tags or data objects
    const scriptMatches = html.match(/<script[\s\S]*?<\/script>/gi) || [];
    console.log("Found script tags count:", scriptMatches.length);

    scriptMatches.forEach((s, idx) => {
      if (s.includes('limit') || s.includes('usage') || s.includes('reset') || s.includes('quota') || s.includes('5h') || s.includes('weekly')) {
        console.log(`\n--- Script #${idx} matched keywords ---`);
        console.log(s.substring(0, 1000));
      }
    });

    // Search for json data strings inside page
    const jsonMatches = html.match(/\{"[\s\S]*?"\}/g) || [];
    console.log("JSON candidates count:", jsonMatches.length);

  } catch (err) {
    console.error("Error:", err.message);
  }
}

parseHtml();
