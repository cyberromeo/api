const fs = require('fs');

const html = fs.readFileSync('opencode_page.html', 'utf-8');

function parseUsageSection(htmlText) {
  const result = {
    rolling: { label: "Rolling Usage (5h)", percentage: 0, resetIn: "N/A" },
    weekly: { label: "Weekly Usage", percentage: 0, resetIn: "N/A" },
    monthly: { label: "Monthly Usage", percentage: 0, resetIn: "N/A" }
  };

  const items = htmlText.split('data-slot="usage-item"');
  items.forEach(item => {
    if (item.includes('Rolling Usage')) {
      const valMatch = item.match(/usage-value">.*?(\d+)%/);
      const resetMatch = item.match(/Resets in[\s\S]*?<!--\$-->([\s\S]*?)<!--\/-->/);
      if (valMatch) result.rolling.percentage = parseInt(valMatch[1], 10);
      if (resetMatch) result.rolling.resetIn = resetMatch[1].trim();
    } else if (item.includes('Weekly Usage')) {
      const valMatch = item.match(/usage-value">.*?(\d+)%/);
      const resetMatch = item.match(/Resets in[\s\S]*?<!--\$-->([\s\S]*?)<!--\/-->/);
      if (valMatch) result.weekly.percentage = parseInt(valMatch[1], 10);
      if (resetMatch) result.weekly.resetIn = resetMatch[1].trim();
    } else if (item.includes('Monthly Usage')) {
      const valMatch = item.match(/usage-value">.*?(\d+)%/);
      const resetMatch = item.match(/Resets in[\s\S]*?<!--\$-->([\s\S]*?)<!--\/-->/);
      if (valMatch) result.monthly.percentage = parseInt(valMatch[1], 10);
      if (resetMatch) result.monthly.resetIn = resetMatch[1].trim();
    }
  });

  return result;
}

console.log("TEST REGEX RESULT:", JSON.stringify(parseUsageSection(html), null, 2));
