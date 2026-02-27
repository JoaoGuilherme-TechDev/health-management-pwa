
// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://localhost:3000/api/cron/process-reminders';

console.log('Starting Health Management Scheduler...');
console.log(`Target API URL: ${API_URL}`);

async function tick() {
  console.log(`[${new Date().toISOString()}] Scheduler: Attempting to fetch ${API_URL}`);
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    console.log(`[${new Date().toISOString()}] Scheduler: Tick success:`, data);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Scheduler: Tick failed:`, err);
  }
}

// Run immediately
tick();

// Run every 60 seconds
setInterval(tick, 60000);
