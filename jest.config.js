// jest.config.js
export default {
    transform: {}, // Prevents Jest from transforming ESM files to CommonJS
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    testEnvironment: "node", // Or 'jsdom' if testing browser-like environments
    verbose: true,
};