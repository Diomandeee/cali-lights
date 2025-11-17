module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@cali/ui/(.*)$": "<rootDir>/packages/ui/src/$1",
    "^@cali/lib/(.*)$": "<rootDir>/packages/lib/src/$1"
  },
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      useESM: false
    }]
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$))"
  ],
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react",
        esModuleInterop: true
      }
    }
  }
};
