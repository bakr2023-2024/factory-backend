import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Item, ItemType, Variant } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type VariantResponse = DataResponse<Variant>;
type PaginatedVariantsResponse = PaginationResponse<Variant[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];
let mockVariants: { itemId: number; unitWeight: number }[] = [];
let createdItems: Item[];
beforeAll(async () => {
  createdItems = await prisma.item.createManyAndReturn({
    data: mockItems,
  });
  mockVariants.push({ itemId: createdItems[0].id, unitWeight: 5 });
  mockVariants.push({ itemId: createdItems[0].id, unitWeight: 7 });
  mockVariants.push({ itemId: createdItems[1].id, unitWeight: 5 });
});
describe("GET /variants", () => {
  let createdVariants: Variant[] = [];

  beforeAll(async () => {
    await prisma.variant.deleteMany({});
    createdVariants = await prisma.variant.createManyAndReturn({
      data: mockVariants,
    });
  });

  it("should return all variants", async () => {
    const res: PaginatedVariantsResponse = await request(app).get("/variants");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdVariants,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdVariants.length,
      }),
    );
  });

  it("should return paginated variants given page and size", async () => {
    const res: PaginatedVariantsResponse = await request(app).get(
      "/variants?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdVariants[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all variants that relate to queried name or item id", async () => {
    const res: PaginatedVariantsResponse = await request(app).get(
      "/variants?name=Fruit%20Tofu",
    );
    const filtered = createdVariants.filter(
      (variant) => variant.itemId === createdItems[0].id,
    );
    const expectedRes = json({
      data: filtered,
      page: 1,
      size: 20,
      totalPages: 1,
      totalCount: filtered.length,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedRes);
    const res2: PaginatedVariantsResponse = await request(app).get(
      `/variants?itemId=${createdItems[0].id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(expectedRes);
  });
});

describe("GET /variants/:id", () => {
  let createdVariant: Variant;

  beforeAll(async () => {
    await prisma.variant.deleteMany({});
    createdVariant = await prisma.variant.create({ data: mockVariants[0] });
  });

  it("should return variant given valid id", async () => {
    const id = createdVariant.id;
    const res: VariantResponse = await request(app).get(`/variants/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdVariant) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/variants/badId");

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

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/variants/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Variant not found");
  });
});

describe("POST /variants", () => {
  beforeAll(async () => {
    await prisma.variant.deleteMany({});
  });

  it("should create variant successfully given itemId and unitWeight", async () => {
    const res: VariantResponse = await request(app)
      .post("/variants")
      .send(mockVariants[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: mockVariants[0] });
  });

  it("should fail given invalid itemId or invalid unitWeight", async () => {
    const res: ErrorResponse = await request(app)
      .post("/variants")
      .send({ itemId: -1, unitWeight: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["itemId"],
      },
      {
        key: "body",
        message: "unit weight must be above 0",
        path: ["unitWeight"],
      },
    ]);
  });
  it("should fail given non-existent itemId", async () => {
    const res: ErrorResponse = await request(app)
      .post("/variants")
      .send({ itemId: 99999999, unitWeight: 1 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No item exists with this ID");
  });
});

describe("PATCH /variants/:id", () => {
  let createdVariant: Variant;
  beforeAll(async () => {
    await prisma.variant.deleteMany({});
    createdVariant = await prisma.variant.create({ data: mockVariants[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdVariant.id;
    const res: VariantResponse = await request(app)
      .patch(`/variants/${id}`)
      .send({ itemId: createdItems[1].id, unitWeight: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdVariant,
          itemId: createdItems[1].id,
          unitWeight: 10,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/variants/badId")
      .send({ unitWeight: 7 });

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
  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/variants/99999999")
      .send({ unitWeight: 12 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Variant not found");
  });
  it("should fail given invalid itemId or invalid unitWeight", async () => {
    const res: ErrorResponse = await request(app)
      .patch(`/variants/${createdVariant.id}`)
      .send({ itemId: -1, unitWeight: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["itemId"],
      },
      {
        key: "body",
        message: "unit weight must be above 0",
        path: ["unitWeight"],
      },
    ]);
  });
  it("should fail given non-existent itemId", async () => {
    const id = createdVariant.id;
    const res: ErrorResponse = await request(app)
      .patch(`/variants/${id}`)
      .send({ itemId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No item exists with that ID");
  });
});

describe("DELETE /variants/:id", () => {
  let createdVariant: Variant;

  beforeAll(async () => {
    await prisma.variant.deleteMany({});
    createdVariant = await prisma.variant.create({ data: mockVariants[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdVariant.id;
    const res: VariantResponse = await request(app).delete(`/variants/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdVariant) });

    const res2: ErrorResponse = await request(app).get(`/variants/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Variant not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/variants/badId");

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

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await request(app).delete("/variants/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Variant not found");
  });
});

afterAll(async () => {
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
