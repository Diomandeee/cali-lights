const { describe, it, expect } = require("@jest/globals");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

describe("Health Check API", () => {
  it("should return healthy status", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBeDefined();
    expect(data.timestamp).toBeDefined();
  });

  it("should include service status", async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    expect(data.services).toBeDefined();
    expect(data.services.database).toBeDefined();
  });
});

