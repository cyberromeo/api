const dates = [
  "24052026",
  "31052026",
  "07062026",
  "14062026",
  "21062026",
  "28062026",
  "12072026",
  "19072026",
  "26072026"
];

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

dates.forEach(dStr => {
  const dd = parseInt(dStr.substring(0, 2), 10);
  const mm = parseInt(dStr.substring(2, 4), 10) - 1;
  const yyyy = parseInt(dStr.substring(4, 8), 10);

  const dateObj = new Date(yyyy, mm, dd);
  const dayName = dayNames[dateObj.getDay()];

  console.log(`Date: ${dStr} -> ${dateObj.toDateString()} -> Day of Week: ${dayName}`);
});
