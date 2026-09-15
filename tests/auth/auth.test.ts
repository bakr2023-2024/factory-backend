import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import request from "supertest";
import app from "../../src/app";
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { verify } from "jsonwebtoken";
import prisma from "../../src/db/prisma";

const mockUser = {
  username: "johnCena123",
  number: "07775000",
  password: "123abcABC",
};
const mockUser2 = {
  username: "test_1",
  number: "987654321",
  password: "123xyzXYZ",
  confirmPassword: "123xyzXYZ",
};

describe("POST /auth/signup", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });
  it("should complete successfully given unique name,number and matching password and confirmPassword", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...mockUser, confirmPassword: mockUser.password });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Signed up successfully");
  });
  it("should fail given duplicate name or number", async () => {
    let res = await request(app)
      .post("/auth/signup")
      .send({
        ...mockUser,
        username: "test_1",
        confirmPassword: mockUser.password,
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("User with this name/number already exists");
    res = await request(app)
      .post("/auth/signup")
      .send({
        ...mockUser,
        number: "012345678",
        confirmPassword: mockUser.password,
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("User with this name/number already exists");
  });
  it("should fail given mismatching password and confirmPassword", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...mockUser2, confirmPassword: "123abcABC" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause.errors[0].issues[0].message).toBe(
      "password and confirmPassword are mismatched",
    );
  });
  it("should fail given invalid password", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...mockUser2, password: "badpass", confirmPassword: "badpass" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause.errors[0].issues[0].message).toBe(
      "make sure that password at least contains 8 characters, contains a number, a lowercase letter and an uppercase letter",
    );
  });
});

describe("POST /auth/login", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
    await request(app)
      .post("/auth/signup")
      .send({ ...mockUser, confirmPassword: mockUser.password });
  });
  it("should complete successfully and respond with access token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: mockUser.username, password: mockUser.password });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged in successfully");
    expect(verify(res.body.token, process.env["JWT_SECRET"]!)).toBeTruthy();
  });
  it("should fail given invalid credentials", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ username: mockUser.username, password: "password" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});
