const { describe, it, expect } = require("@jest/globals");

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

describe("Authentication", () => {
  it("should require authentication for protected routes", async () => {
    const response = await fetch(`${BASE_URL}/api/gallery/media`);
    expect(response.status).toBe(401);
  });

  it("should validate UUID format", async () => {
    const response = await fetch(`${BASE_URL}/api/gallery/media?chainId=invalid-uuid`);
    expect(response.status).toBe(422);
  });
});

