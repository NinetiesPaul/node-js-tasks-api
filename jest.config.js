module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    "controllers/**/*.js",
    "routes/**/*.js"
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["html", "text"]
};