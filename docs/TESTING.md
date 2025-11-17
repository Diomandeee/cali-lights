# Testing Guide

This guide covers testing strategies for Cali Lights.

## Test Structure

```
__tests__/
  unit/
    logger.test.ts
    color.test.ts
  api/
    health.test.ts
    auth.test.ts
  integration/
    mission-flow.test.ts
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

## Test Types

### Unit Tests
- Test individual functions and utilities
- Fast execution
- No external dependencies
- Examples: logger, color utilities, validation

### Integration Tests
- Test API endpoints
- Test database interactions
- Test service integrations
- Examples: mission flow, entry commit, chapter generation

### End-to-End Tests
- Test complete user flows
- Test across multiple services
- Examples: full mission lifecycle, invite flow

## Writing Tests

### Example Unit Test

```typescript
import { describe, it, expect } from "@jest/globals";
import { circularMean } from "@cali/lib/color";

describe("circularMean", () => {
  it("should calculate mean of hues", () => {
    const mean = circularMean([0, 90, 180, 270]);
    expect(mean).toBeGreaterThanOrEqual(0);
    expect(mean).toBeLessThanOrEqual(360);
  });
});
```

### Example API Test

```typescript
import { describe, it, expect } from "@jest/globals";

describe("Health Check API", () => {
  it("should return healthy status", async () => {
    const response = await fetch("http://localhost:3000/api/health");
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe("healthy");
  });
});
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths covered
- **E2E Tests**: Main user flows covered

## Continuous Integration

Tests run automatically on:
- Pull requests
- Pushes to main/master
- Before deployment

See `.github/workflows/ci.yml` for CI configuration.

## Mocking

### Database
Use test database or mocks for unit tests.

### External APIs
Mock external API calls in tests:
- Google Vision API
- Veo API
- Cloudinary

### Example Mock

```typescript
jest.mock("@/lib/services/metadata", () => ({
  analyseMediaMetadata: jest.fn().mockResolvedValue({
    dominantHue: 180,
    palette: ["#FF0000", "#00FF00"],
    sceneTags: ["outdoor", "nature"],
    objectTags: ["tree", "sky"],
  }),
}));
```

## Best Practices

1. **Isolate Tests**: Each test should be independent
2. **Clean Up**: Reset state between tests
3. **Use Descriptive Names**: Test names should describe what they test
4. **Test Edge Cases**: Include boundary conditions
5. **Mock External Services**: Don't hit real APIs in tests
6. **Fast Tests**: Keep unit tests fast (< 100ms each)

## Debugging Tests

```bash
# Run specific test file
npm test -- logger.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should calculate"

# Run with verbose output
npm test -- --verbose
```

## Test Data

Use fixtures for consistent test data:

```typescript
export const testUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
};

export const testMission = {
  id: "test-mission-id",
  chain_id: "test-chain-id",
  prompt: "Test prompt",
  state: "LOBBY",
};
```

