/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupBrowser.js"],
  testEnvironmentOptions: {
    url: "http://localhost/",
  },
  testMatch: [
    "<rootDir>/src/**/*.test.js?(x)",
    "<rootDir>/src/**/*.spec.js?(x)",
  ],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    "^.+\\.jsx?$": [
      "babel-jest",
      {
        // Keep Jest transforms independent from the Vite build.
        babelrc: false,
        configFile: false,
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          ["@babel/preset-react", { runtime: "classic" }],
        ],
        plugins: [
          ["@babel/plugin-proposal-decorators", { legacy: true }],
          ["@babel/plugin-transform-class-properties", { loose: true }],
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^components/(.*)$": "<rootDir>/src/components/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(gif|png|jpe?g|svg|woff2?|ttf|eot)$": "<rootDir>/tests/fileMock.js",
    "^@douyinfe/semi-ui/lib/es/(.*)$":
      "<rootDir>/node_modules/@douyinfe/semi-ui/lib/cjs/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!src/**/*.spec.{js,jsx}",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text-summary", "html", "lcov", "json-summary"],
};
