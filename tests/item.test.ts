import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { ItemType } from "../src/db/generated/prisma/enums";
import { Item } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type ItemResponse = DataResponse<Item>;
type PaginatedItemsResponse = PaginationResponse<Item[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];

describe("GET /items", () => {
  let createdItems: Item[] = [];

  beforeAll(async () => {
    await prisma.item.deleteMany({});
    createdItems = await prisma.item.createManyAndReturn({
      data: mockItems,
    });
  });

  it("should return all items", async () => {
    const res: PaginatedItemsResponse = await request(app).get("/items");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdItems,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdItems.length,
      }),
    );
  });

  it("should return paginated items given page and size", async () => {
    const res: PaginatedItemsResponse = await request(app).get(
      "/items?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdItems[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all items that contain search key", async () => {
    const res: PaginatedItemsResponse =
      await request(app).get("/items?name=tofu");

    const filtered = createdItems.filter((item) =>
      item.name.toLowerCase().includes("tofu"),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });
    it("should return all items sorted according to sortBy and order", async () => {
      const res: PaginatedItemsResponse = await request(app).get(
        "/items?sortBy=name&order=desc",
      );
      const sorted = createdItems.toSorted((a, b) =>
        b.name.localeCompare(a.name),
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        json({
          data: sorted,
          page: 1,
          size: 20,
          totalPages: 1,
          totalCount: sorted.length,
        }),
      );
    });
});

describe("GET /items/:id", () => {
  let createdItem: Item;

  beforeAll(async () => {
    await prisma.item.deleteMany({});
    createdItem = await prisma.item.create({ data: mockItems[0] });
  });

  it("should return item given valid id", async () => {
    const id = createdItem.id
    const res: ItemResponse = await request(app).get(
      `/items/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(json(createdItem));
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/items/badId");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "params",
        message: "ID can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if item isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/items/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
});

describe("POST /items", () => {
  beforeAll(async () => {
    await prisma.item.deleteMany({});
  });

  it("should create item successfully given name and type", async () => {
    const res: ItemResponse = await request(app)
      .post("/items")
      .send(mockItems[0]);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject(mockItems[0]);
  });

  it("should fail given duplicate name", async () => {
    const res: ErrorResponse = await request(app)
      .post("/items")
      .send(mockItems[0]);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "An item with this name already exists",
    );
  });
});

describe("PATCH /items/:id", () => {
  let createdItems: Item[];
  const newName = "Unique item";

  beforeAll(async () => {
    await prisma.item.deleteMany({});
    createdItems = await prisma.item.createManyAndReturn({ data: mockItems });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdItems[0].id
    const res: ItemResponse = await request(app)
      .patch(`/items/${id}`)
      .send({ name: newName });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      ...json(createdItems[0]),
      name: newName,
      updatedAt: expect.any(String),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/items/badId")
      .send({ name: newName });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "params",
        message: "ID can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if item isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/items/999999999")
      .send({ name: "New item name" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });

  it("should fail given duplicate name", async () => {
    const id = createdItems[0].id
    const res: ErrorResponse = await request(app)
      .patch(`/items/${id}`)
      .send({ name: createdItems[1].name });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "An item with this name already exists",
    );
  });
});

describe("DELETE /items/:id", () => {
  let createdItem: Item;

  beforeAll(async () => {
    await prisma.item.deleteMany({});
    createdItem = await prisma.item.create({ data: mockItems[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdItem.id
    const res: ItemResponse = await request(app).delete(
      `/items/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(json({ data: createdItem }));

    const res2: ErrorResponse = await request(app).get(
      `/items/${id}`,
    );
    
    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Item not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/items/badId");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "params",
        message: "ID can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if item isn't found", async () => {
    const res: ErrorResponse = await request(app).delete(
      "/items/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
});

afterAll(async () => {
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
