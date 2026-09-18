import { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/*.test.ts"],
  maxWorkers: 1,
};
export default config;
