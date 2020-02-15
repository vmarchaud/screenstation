// Usage:
//      E2E_TEST='true' jest src/test/e2e/browser.specs.ts
// const isE2ETest = process.env.E2E_TEST === 'true';

module.exports = {
  // cache: false,

  preset: "ts-jest",

  moduleFileExtensions: [
    'js',
    'jsx',
    'json',
    'vue',
    'ts',
    'tsx'
  ],
  transform: {
    '\\.jsx?$': '<rootDir>/node_modules/babel-jest',

    '^.+\\.vue$': '<rootDir>/node_modules/vue-jest',
    
    '.+\\.(css|styl|less|sass|scss|svg|png|jpg|ttf|woff|woff2)$': 'jest-transform-stub',

    "^.+\\.(ts|tsx)$": "<rootDir>/node_modules/ts-jest",
  },
  
  // An array of regexp pattern strings that are matched against all source file paths,
  // matched files will skip transformation
  //
  // A MUST! if the following module is in ES6-Format!!!!
  //
  transformIgnorePatterns: [
    "<rootDir>/node_modules/(?!@mmit\/communication)"
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  snapshotSerializers: [
    'jest-serializer-vue'
  ],

    // The test environment that will be used for testing
    //      https://jestjs.io/docs/en/configuration.html#testenvironment-string
    testEnvironment: 'jsdom',
    // testEnvironment: 'node',

  testMatch: [
    '<rootDir>/tests/**/*.(spec|specs|test).(js|jsx|ts|tsx)',
    '<rootDir>/__tests__/*.(js|jsx|ts|tsx)'
  ],
  testURL: 'http://localhost/',

  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js', 'jest-extended'],
};

// if(isE2ETest) {
//   module.exports.globalSetup = "jest-environment-puppeteer/setup";
//   module.exports.globalTeardown = "jest-environment-puppeteer/teardown";
//   module.exports.testEnvironment = "jest-environment-puppeteer";
// }
