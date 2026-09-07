#!/usr/bin/env node

/**
 * Test script untuk cleanup completed teams cron job
 * Usage: node scripts/test-cleanup-cron.mjs
 */

import https from "https";

const BASE_URL = process.env.CLEANUP_TEST_URL || "http://localhost:3000";
const CLEANUP_SECRET = process.env.CLEANUP_SECRET || "default-secret";

async function testCleanup() {
  console.log(`🔧 Testing cleanup cron job...`);
  console.log(`   URL: ${BASE_URL}/api/cron/cleanup-completed-teams`);
  console.log(`   Secret: ${CLEANUP_SECRET.substring(0, 5)}...`);

  try {
    const url = new URL(`${BASE_URL}/api/cron/cleanup-completed-teams`);
    
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : await import("http");

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CLEANUP_SECRET}`,
      },
    };

    const req = client.request(url, options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        console.log(`\n✅ Response Status: ${res.statusCode}`);
        try {
          const json = JSON.parse(data);
          console.log("📊 Response Data:");
          console.log(JSON.stringify(json, null, 2));
        } catch {
          console.log("📝 Response Text:");
          console.log(data);
        }
      });
    });

    req.on("error", (err) => {
      console.error(`❌ Error: ${err.message}`);
      process.exit(1);
    });

    req.end();
  } catch (error) {
    console.error(`❌ Error:`, error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testCleanup();
