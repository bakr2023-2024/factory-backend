import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import request from "supertest";
import app from "../../src/app";
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import prisma from "../../src/db/prisma";
import { ItemType } from "../../src/db/generated/prisma/enums";
const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];
describe("GET /items", () => {
  beforeAll(async () => {
    await prisma.item.deleteMany({});
    await prisma.item.createMany({ data: mockItems });
  });
  it("should return all items", async () => {
    const res = (await request(app).get("/items")) as any;
    expect(res.status).toBe(200);
    for (let i = 0; i < mockItems.length; i++) {
      expect(res.body.items[i].name).toBe(mockItems[i].name);
      expect(res.body.items[i].type).toBe(mockItems[i].type);
    }
  });
  it("should return paginated items given page and size", async () => {
    const res = (await request(app).get("/items?page=2&size=2")) as any;
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].name).toBe("Honey Barrel");
    expect(res.body.items[0].type).toBe("MATERIAL");
    expect(res.body.totalPages).toBe(2);
    expect(res.body.totalItems).toBe(3);
  });
});
describe("GET /items/:id", () => {
  let validId = 0;
  beforeAll(async () => {
    await prisma.item.deleteMany({});
    const item = await prisma.item.create({ data: mockItems[0] });
    validId = item.id;
  });
  it("should return item given valid id", async () => {
    const res = (await request(app).get(`/items/${validId}`)) as any;
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe(mockItems[0].name);
    expect(res.body.item.type).toBe(mockItems[0].type);
  });
  it("should respond with error given invalid id", async () => {
    const res = await request(app).get("/items/badId");
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause.errors[0].issues[0].message).toBe(
      "ID can only be a positive integer",
    );
  });
  it("should respond with error if item isn't found", async () => {
    const res = await request(app).get("/items/999999999");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
});
describe("POST /items", () => {
  beforeAll(async () => {
    await prisma.item.deleteMany({});
  });
  it("should create item successfully given name and type", async () => {
    const res = (await request(app).post("/items").send(mockItems[0])) as any;
    expect(res.status).toBe(201);
    expect(res.body.item.name).toBe(mockItems[0].name);
    expect(res.body.item.type).toBe(mockItems[0].type);
  });
  it("should fail given duplicate name", async () => {
    const res = await request(app).post("/items").send(mockItems[0]);
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("An item with this name already exists");
  });
});
describe("PATCH /items/:id", () => {
  let validId = 0;
  beforeAll(async () => {
    await prisma.item.deleteMany({});
    await prisma.item.createMany({ data: mockItems });
    const item = await prisma.item.findUnique({
      where: { name: mockItems[0].name },
    });
    validId = item!.id;
  });
  it("should correctly update field(s) given id and fields to change", async () => {
    const res = (await request(app)
      .patch(`/items/${validId}`)
      .send({ name: "Unique item" })) as any;
    expect(res.status).toBe(200);
    expect(res.body.item.name).toBe("Unique item");
  });
  it("should fail if item isn't found", async () => {
    const res = await request(app)
      .patch("/items/999999999")
      .send({ name: "New item name" });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
  it("should fail given duplicate name", async () => {
    const res = await request(app)
      .patch(`/items/${validId}`)
      .send({ name: mockItems[1].name });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("An item with this name already exists");
  });
});
describe("DELETE /items/:id", () => {
  let validId = 0;
  beforeAll(async () => {
    await prisma.item.deleteMany({});
    await prisma.item.createMany({ data: mockItems });
    const item = await prisma.item.findUnique({
      where: { name: mockItems[0].name },
    });
    validId = item!.id;
  });
  it("should delete successfully given valid id", async () => {
    const res = (await request(app).delete(`/items/${validId}`)) as any;
    expect(res.status).toBe(200);
    const res2 = await request(app).get(`/items/${validId}`);
    expect(res2.status).toBe(404);
  });
  it("should fail if item isn't found", async () => {
    const res = (await request(app).delete(`/items/${validId}`)) as any;
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
  it("should fail given invalid id", async () => {
    const res = await request(app).delete(`/items/badId`);
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause.errors[0].issues[0].message).toBe(
      "ID can only be a positive integer",
    );
  });
});
afterAll(async () => {
  await prisma.$disconnect();
});
