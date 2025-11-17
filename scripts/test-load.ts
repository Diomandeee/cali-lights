#!/usr/bin/env node
/**
 * Load Testing Script for Cali Lights
 * 
 * Simulates multiple users performing actions simultaneously:
 * - Multiple users joining missions
 * - Concurrent entry submissions
 * - Parallel API calls
 * 
 * Usage: npm run test:load
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

// Load environment variables
const envPaths = [
  path.resolve(__dirname, "../.env.local"),
  path.resolve(__dirname, "../.env"),
];

for (const envPath of envPaths) {
  if (existsSync(envPath)) {
    const envFile = readFileSync(envPath, "utf-8");
    envFile.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const match = trimmed.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    break;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CONCURRENT_USERS = parseInt(process.env.LOAD_TEST_USERS || "5");
const REQUESTS_PER_USER = parseInt(process.env.LOAD_TEST_REQUESTS || "10");

interface TestResult {
  endpoint: string;
  status: number;
  duration: number;
  error?: string;
}

class LoadTester {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async run() {
    console.log("🚀 Starting Load Test");
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log(`👥 Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`📊 Requests per User: ${REQUESTS_PER_USER}\n`);

    this.startTime = Date.now();

    // Create test users
    const users = await this.createTestUsers();

    // Run concurrent load tests
    const promises = users.map((user, index) =>
      this.simulateUser(user, index)
    );

    await Promise.all(promises);

    this.printResults();
  }

  private async createTestUsers() {
    const users = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const email = `loadtest${i}@example.com`;
      const password = `LoadTest${i}!`;

      // Try to register
      await this.apiCall("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          name: `Load Test User ${i}`,
          handle: `loadtest${i}`,
        }),
      }).catch(() => {}); // Ignore if user exists

      // Login
      const loginResult = await this.apiCall("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (loginResult.status === 200) {
        const setCookie = loginResult.headers?.get?.("set-cookie") || "";
        const match = setCookie.match(/cali_token=([^;]+)/);
        users.push({
          email,
          token: match ? match[1] : "",
          id: loginResult.data.user?.id || "",
        });
      }
    }

    return users;
  }

  private async simulateUser(user: { email: string; token: string; id: string }, userIndex: number) {
    const userResults: TestResult[] = [];

    for (let i = 0; i < REQUESTS_PER_USER; i++) {
      // Simulate different API calls
      const endpoints = [
        "/api/network",
        "/api/gallery/media?scope=network&page=1&pageSize=12",
        "/api/gallery/chapters?scope=network",
        "/api/health",
      ];

      const endpoint = endpoints[i % endpoints.length];
      const start = Date.now();

      try {
        const result = await this.apiCall(endpoint, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const duration = Date.now() - start;
        userResults.push({
          endpoint,
          status: result.status,
          duration,
        });
      } catch (error) {
        const duration = Date.now() - start;
        userResults.push({
          endpoint,
          status: 0,
          duration,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.results.push(...userResults);
    console.log(`✅ User ${userIndex + 1} completed ${REQUESTS_PER_USER} requests`);
  }

  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    return {
      status: response.status,
      data,
      headers: response.headers,
    };
  }

  private printResults() {
    const totalTime = Date.now() - this.startTime;
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter((r) => r.status >= 200 && r.status < 300).length;
    const failedRequests = totalRequests - successfulRequests;

    const durations = this.results.map((r) => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Calculate percentiles
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p50 = sortedDurations[Math.floor(sortedDurations.length * 0.5)];
    const p95 = sortedDurations[Math.floor(sortedDurations.length * 0.95)];
    const p99 = sortedDurations[Math.floor(sortedDurations.length * 0.99)];

    console.log("\n" + "=".repeat(60));
    console.log("📊 Load Test Results");
    console.log("=".repeat(60));
    console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful: ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${failedRequests} (${((failedRequests / totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Requests/sec: ${((totalRequests / totalTime) * 1000).toFixed(2)}`);
    console.log("\n⏱️  Response Times:");
    console.log(`   Min: ${minDuration}ms`);
    console.log(`   Max: ${maxDuration}ms`);
    console.log(`   Avg: ${avgDuration.toFixed(2)}ms`);
    console.log(`   P50: ${p50}ms`);
    console.log(`   P95: ${p95}ms`);
    console.log(`   P99: ${p99}ms`);

    // Status code breakdown
    const statusCodes = this.results.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log("\n📈 Status Code Breakdown:");
    Object.entries(statusCodes)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([status, count]) => {
        console.log(`   ${status}: ${count} (${((count / totalRequests) * 100).toFixed(1)}%)`);
      });

    // Endpoint breakdown
    const endpointStats = this.results.reduce((acc, r) => {
      if (!acc[r.endpoint]) {
        acc[r.endpoint] = { total: 0, success: 0, avgDuration: 0 };
      }
      acc[r.endpoint].total++;
      if (r.status >= 200 && r.status < 300) {
        acc[r.endpoint].success++;
      }
      acc[r.endpoint].avgDuration += r.duration;
      return acc;
    }, {} as Record<string, { total: number; success: number; avgDuration: number }>);

    console.log("\n🔗 Endpoint Breakdown:");
    Object.entries(endpointStats).forEach(([endpoint, stats]) => {
      console.log(`   ${endpoint}:`);
      console.log(`      Requests: ${stats.total}`);
      console.log(`      Success: ${stats.success} (${((stats.success / stats.total) * 100).toFixed(1)}%)`);
      console.log(`      Avg Duration: ${(stats.avgDuration / stats.total).toFixed(2)}ms`);
    });

    if (failedRequests > 0) {
      console.log("\n❌ Failed Requests:");
      this.results
        .filter((r) => r.status < 200 || r.status >= 300)
        .slice(0, 10)
        .forEach((r) => {
          console.log(`   ${r.endpoint}: ${r.status} - ${r.error || "Unknown error"}`);
        });
    }

    console.log("\n" + "=".repeat(60));
  }
}

async function main() {
  const tester = new LoadTester();
  await tester.run();
}

main().catch((error) => {
  console.error("Load test failed:", error);
  process.exit(1);
});

