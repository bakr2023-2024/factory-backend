import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import request from "supertest";
import app from "../src/app";
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { verify } from "jsonwebtoken";
import prisma from "../src/db/prisma";
import { DataResponse, ErrorResponse } from "../src/utils/types/response.types";
import { Item, ItemType, Role, User } from "../src/db/generated/prisma/client";
import { signToken } from "../src/utils/security/token.security";
import { json } from "./helpers/auth";
type SignupResponse = DataResponse<User>;
type LoginResponse = DataResponse<string>;
type ItemResponse = DataResponse<Item>;

const mockUser = {
  username: "test_user",
  number: "07775000",
  password: "123abcABC",
  role: Role.USER,
};
const mockAdmin = {
  username: "test_admin",
  number: "987654321",
  password: "123xyzXYZ",
  role: Role.ADMIN,
};

describe("POST /auth/signup", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({});
  });
  it("should complete successfully given unique name,number and matching password and confirmPassword", async () => {
    const res: SignupResponse = await request(app)
      .post("/auth/signup")
      .send({ ...mockUser, confirmPassword: mockUser.password });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      username: mockUser.username,
      number: mockUser.number,
    });
  });
  it("should fail given duplicate name or number", async () => {
    let res: ErrorResponse = await request(app)
      .post("/auth/signup")
      .send({
        ...mockUser,
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
    const res: ErrorResponse = await request(app)
      .post("/auth/signup")
      .send({ ...mockAdmin, confirmPassword: "123abcABC" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "password and confirmPassword are mismatched",
        path: ["confirmPassword"],
      },
    ]);
  });
  it("should fail given invalid password", async () => {
    const res: ErrorResponse = await request(app)
      .post("/auth/signup")
      .send({ ...mockAdmin, password: "badpass", confirmPassword: "badpass" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message:
          "make sure that password at least contains 8 characters, contains a number, a lowercase letter and an uppercase letter",
        path: ["password"],
      },
    ]);
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
    const res: LoginResponse = await request(app)
      .post("/auth/login")
      .send({ username: mockUser.username, password: mockUser.password });
    expect(res.status).toBe(200);
    expect(verify(res.body.data, process.env["JWT_SECRET"]!)).toBeTruthy();
  });
  it("should fail given invalid credentials", async () => {
    const res: ErrorResponse = await request(app)
      .post("/auth/login")
      .send({ username: mockUser.username, password: "password" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid credentials");
  });
});

describe("accessing protected routes", () => {
  let userToken = "";
  let adminToken = "";
  beforeAll(async () => {
    await prisma.user.deleteMany({});
    const user = await prisma.user.create({ data: mockUser });
    const admin = await prisma.user.create({ data: mockAdmin });
    userToken = signToken({ sub: user.id.toString() });
    adminToken = signToken({ sub: admin.id.toString() });
  });
  it("should only work for authenticated users", async () => {
    const res1: ErrorResponse = await request(app)
      .post("/items")
      .send({ name: "Test item", type: ItemType.PRODUCT });
    expect(res1.status).toBe(401);
    expect(res1.body.message).toBe("Missing or invalid access token");
    const res2: ItemResponse = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test item", type: ItemType.PRODUCT });
    expect(res2.status).toBe(201);
    expect(res2.body.data).toMatchObject(json({ name: "Test item" }));
  });
  it("should be authorized only for role ADMIN to create a resource", async () => {
    const res1: ErrorResponse = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "Test item 2", type: ItemType.PRODUCT });
    expect(res1.status).toBe(403);
    expect(res1.body.message).toBe("Access denied");
    const res2: ItemResponse = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test item 2", type: ItemType.PRODUCT });
    expect(res2.status).toBe(201);
    expect(res2.body.data).toMatchObject(json({ name: "Test item 2" }));
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
