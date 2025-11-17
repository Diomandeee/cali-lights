const { describe, it, expect } = require("@jest/globals");
const { retryWithBackoff, safeExecute } = require("@/lib/utils/logger");

describe("Retry Logic", () => {
  it("should retry on failure", async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("Failed");
      }
      return "success";
    };

    const result = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  it("should fail after max retries", async () => {
    const fn = async () => {
      throw new Error("Always fails");
    };

    await expect(
      retryWithBackoff(fn, { maxRetries: 2 })
    ).rejects.toThrow("Always fails");
  });
});

describe("Safe Execute", () => {
  it("should return fallback on error", async () => {
    const fn = async () => {
      throw new Error("Error");
    };

    const result = await safeExecute(fn, "fallback");
    expect(result).toBe("fallback");
  });

  it("should return result on success", async () => {
    const fn = async () => "success";

    const result = await safeExecute(fn, "fallback");
    expect(result).toBe("success");
  });
});

