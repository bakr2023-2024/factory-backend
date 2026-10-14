import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { ItemType } from "../../src/db/generated/prisma/enums";
import { Item } from "../../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../../src/utils/types/response.types";
import {
  json,
  auth,
  login,
  cleanDatabase,
  populateDatabase,
  MockData,
} from "../utils";
import prisma from "../../src/db/prisma";

type ItemResponse = DataResponse<Item>;
type PaginatedItemsResponse = PaginationResponse<Item[]>;

const newItem = { name: "New Item", type: ItemType.MATERIAL };

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /items", () => {
  it("should return all items", async () => {
    const res: PaginatedItemsResponse = await auth().get("/items");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.items,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.items.length / 20),
        totalCount: seed.items.length,
      }),
    );
  });

  it("should return paginated items given page and size", async () => {
    const res: PaginatedItemsResponse = await auth().get(
      "/items?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.items.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.items.length / 2),
        totalCount: seed.items.length,
      }),
    );
  });

  it("should return all items that contain search key", async () => {
    const res: PaginatedItemsResponse = await auth().get("/items?name=tofu");
    const filtered = seed.items.filter((item) =>
      item.name.toLowerCase().includes("tofu"),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: Math.ceil(filtered.length / 20),
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all items sorted according to sortBy and order", async () => {
    const res: PaginatedItemsResponse = await auth().get(
      "/items?sortBy=name&order=desc",
    );
    const sorted = seed.items.toSorted((a, b) => b.name.localeCompare(a.name));

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: sorted,
        page: 1,
        size: 20,
        totalPages: Math.ceil(sorted.length / 20),
        totalCount: sorted.length,
      }),
    );
  });
});

describe("GET /items/:id", () => {
  it("should return item given valid id", async () => {
    const item = seed.items[0];
    const res: ItemResponse = await auth().get(`/items/${item.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(json(item));
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/items/badId");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "params",
        message: "value can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if item isn't found", async () => {
    const res: ErrorResponse = await auth().get("/items/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
});

describe("POST /items", () => {
  it("should create item successfully given name and type", async () => {
    const res: ItemResponse = await auth().post("/items").send(newItem);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject(newItem);
  });

  it("should fail given duplicate name", async () => {
    const res: ErrorResponse = await auth()
      .post("/items")
      .send({ name: seed.items[0].name, type: seed.items[0].type });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("An item with this name already exists");
  });
});

describe("PATCH /items/:id", () => {
  const newName = "Unique item";

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const item = seed.items[0];
    const res: ItemResponse = await auth()
      .patch(`/items/${item.id}`)
      .send({ name: newName });

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      ...json(item),
      name: newName,
      updatedAt: expect.any(String),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/items/badId")
      .send({ name: newName });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "params",
        message: "value can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if item isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/items/999999999")
      .send({ name: "New item name" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });

  it("should fail given duplicate name", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/items/${seed.items[0].id}`)
      .send({ name: seed.items[1].name });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("An item with this name already exists");
  });
});

describe("DELETE /items/:id", () => {
  // every seeded item has variants that are used by other rows, so delete one with no children
  let createdItem: Item;

  beforeAll(async () => {
    createdItem = await prisma.item.create({
      data: { name: "Disposable item", type: ItemType.PRODUCT },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdItem.id;
    const res: ItemResponse = await auth().delete(`/items/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(json({ data: createdItem }));

    const res2: ErrorResponse = await auth().get(`/items/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Item not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/items/badId");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "params",
        message: "value can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if item isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/items/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Item not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
