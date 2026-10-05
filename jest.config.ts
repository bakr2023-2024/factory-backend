import { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/*.test.ts"],
  maxWorkers: 1,
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
  },
};
export default config;