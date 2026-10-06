import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Item,
  ItemType,
  ProductionBatch,
  ProductionDay,
  ProductionEntry,
  Season,
  Variant,
  Week,
} from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, auth, login } from "./helpers/auth";
import prisma from "../src/db/prisma";
type ProductionBatchResponse = DataResponse<ProductionBatch>;
type PaginatedProductionBatchesResponse = PaginationResponse<ProductionBatch[]>;
const mockSeason = {
  name: "season 1",
  startDate: new Date("2026-09-24T00:00:00Z"),
};
let createdSeason: Season;
const mockWeeks = [
  { startDate: new Date("2026-09-24T00:00:00Z") },
  { startDate: new Date("2026-09-27T00:00:00Z") },
];
let createdWeeks: Week[];
const mockProductionDays = [
  {
    productionDate: new Date("2026-09-24T00:00:00Z"),
    startedAt: new Date("2026-09-24T08:00:00Z"),
  },
  {
    productionDate: new Date("2026-09-25T00:00:00Z"),
    startedAt: new Date("2026-09-25T08:00:00Z"),
  },
  {
    productionDate: new Date("2026-09-27T00:00:00Z"),
    startedAt: new Date("2026-09-27T08:00:00Z"),
  },
];
let createdProductionDays: ProductionDay[];
const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];
let createdItems: Item[];
const mockVariants: { itemId: number; unitWeight: number }[] = [];
let createdVariants: Variant[] = [];
const mockProductionEntries: { productionDayId: number; variantId: number }[] =
  [];
let createdProductionEntries: ProductionEntry[] = [];
const mockProductionBatches: {
  productionEntryId: number;
  quantity: number;
  occurredAt: Date;
  notes?: string;
}[] = [];
beforeAll(async () => {
  await login();
  await prisma.productionBatch.deleteMany({});
  await prisma.productionEntry.deleteMany({});
  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  createdSeason = await prisma.season.create({ data: mockSeason });
  createdWeeks = await prisma.week.createManyAndReturn({
    data: mockWeeks.map((w) => ({ ...w, seasonId: createdSeason.id })),
  });
  createdProductionDays = await prisma.productionDay.createManyAndReturn({
    data: [
      { ...mockProductionDays[0], weekId: createdWeeks[0].id },
      { ...mockProductionDays[1], weekId: createdWeeks[0].id },
      { ...mockProductionDays[2], weekId: createdWeeks[1].id },
    ],
  });
  createdItems = await prisma.item.createManyAndReturn({ data: mockItems });
  mockVariants.push(
    { itemId: createdItems[0].id, unitWeight: 5 },
    { itemId: createdItems[0].id, unitWeight: 7 },
    { itemId: createdItems[1].id, unitWeight: 3 },
  );
  createdVariants = await prisma.variant.createManyAndReturn({
    data: mockVariants,
  });
  mockProductionEntries.push(
    {
      productionDayId: createdProductionDays[0].id,
      variantId: createdVariants[0].id,
    },
    {
      productionDayId: createdProductionDays[0].id,
      variantId: createdVariants[1].id,
    },
    {
      productionDayId: createdProductionDays[1].id,
      variantId: createdVariants[2].id,
    },
  );
  createdProductionEntries = await prisma.productionEntry.createManyAndReturn({
    data: mockProductionEntries,
  });
  mockProductionBatches.push(
    {
      productionEntryId: createdProductionEntries[0].id,
      quantity: 10,
      occurredAt: new Date("2026-09-24T09:00:00Z"),
      notes: "First batch",
    },
    {
      productionEntryId: createdProductionEntries[0].id,
      quantity: 20,
      occurredAt: new Date("2026-09-24T10:00:00Z"),
      notes: "Second batch",
    },
    {
      productionEntryId: createdProductionEntries[1].id,
      quantity: 15,
      occurredAt: new Date("2026-09-25T09:00:00Z"),
    },
    {
      productionEntryId: createdProductionEntries[2].id,
      quantity: 30,
      occurredAt: new Date("2026-09-27T09:00:00Z"),
    },
  );
});
describe("GET /productionBatches", () => {
  let createdProductionBatches: ProductionBatch[] = [];
  beforeAll(async () => {
    createdProductionBatches = await prisma.productionBatch.createManyAndReturn(
      { data: mockProductionBatches },
    );
  });
  it("should return all productionBatches", async () => {
    const res: PaginatedProductionBatchesResponse =
      await auth().get("/productionBatches");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdProductionBatches,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdProductionBatches.length,
      }),
    );
  });
  it("should return paginated productionBatches given page and size", async () => {
    const res: PaginatedProductionBatchesResponse = await auth().get(
      "/productionBatches?page=2&size=2",
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdProductionBatches[2], createdProductionBatches[3]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 4,
      }),
    );
  });
  it("should return all productionBatches given productionEntryId", async () => {
    const productionEntryId = createdProductionEntries[0].id;
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?productionEntryId=${productionEntryId}`,
    );
    const filtered = createdProductionBatches.filter(
      (productionBatch) =>
        productionBatch.productionEntryId === productionEntryId,
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
  it("should return all productionBatches given productionDayId", async () => {
    const productionDayId = createdProductionDays[0].id;
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?productionDayId=${productionDayId}`,
    );
    const productionEntryIds = createdProductionEntries
      .filter(
        (productionEntry) =>
          productionEntry.productionDayId === productionDayId,
      )
      .map((productionEntry) => productionEntry.id);
    const filtered = createdProductionBatches.filter((productionBatch) =>
      productionEntryIds.includes(productionBatch.productionEntryId),
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
  it("should return all productionBatches given productionDate", async () => {
    const productionDate = "2026-09-24";
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?productionDate=${productionDate}`,
    );
    const filtered = createdProductionBatches.filter((productionBatch) => {
      const productionEntry = createdProductionEntries.find(
        (productionEntry) =>
          productionEntry.id === productionBatch.productionEntryId,
      );
      const productionDay = createdProductionDays.find(
        (productionDay) =>
          productionDay.id === productionEntry!.productionDayId,
      );
      return (
        productionDay!.productionDate.toISOString().slice(0, 10) ===
        productionDate
      );
    });
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
  it("should return all productionBatches that relate to queried Name", async () => {
    const res: PaginatedProductionBatchesResponse = await auth().get(
      "/productionBatches?itemName=Fruit%20Tofu",
    );
    const filtered = createdProductionBatches.filter((productionBatch) => {
      const productionEntry = createdProductionEntries.find(
        (productionEntry) =>
          productionEntry.id === productionBatch.productionEntryId,
      )!;
      const variant = createdVariants.find(
        (variant) => variant.id === productionEntry.variantId,
      )!;
      const item = createdItems.find(
        (item) => item.id === variant.itemId && item.name === "Fruit Tofu",
      );
      return item;
    });
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
  it("should return all productionBatches given unitWeight", async () => {
    const unitWeight = 5;
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?unitWeight=${unitWeight}`,
    );
    const productionEntryIds = createdProductionEntries
      .filter((productionEntry) => {
        const variant = createdVariants.find(
          (variant) => variant.id === productionEntry.variantId,
        );
        return variant!.unitWeight.toNumber() == unitWeight;
      })
      .map((productionEntry) => productionEntry.id);
    const filtered = createdProductionBatches.filter((productionBatch) =>
      productionEntryIds.includes(productionBatch.productionEntryId),
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
  it("should return all productionBatches given occurredFrom", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?occurredFrom=${encodeURIComponent(occurredFrom)}`,
    );
    const filtered = createdProductionBatches.filter(
      (productionBatch) => productionBatch.occurredAt >= new Date(occurredFrom),
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
  it("should return all productionBatches given occurredTo", async () => {
    const occurredTo = "2026-09-25T09:00:00.000Z";
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?occurredTo=${encodeURIComponent(occurredTo)}`,
    );
    const filtered = createdProductionBatches.filter(
      (productionBatch) => productionBatch.occurredAt <= new Date(occurredTo),
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
  it("should return all productionBatches given occurredFrom and occurredTo", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";
    const occurredTo = "2026-09-25T09:00:00.000Z";
    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?occurredFrom=${encodeURIComponent(occurredFrom)}&occurredTo=${encodeURIComponent(occurredTo)}`,
    );
    const filtered = createdProductionBatches.filter(
      (productionBatch) =>
        productionBatch.occurredAt >= new Date(occurredFrom) &&
        productionBatch.occurredAt <= new Date(occurredTo),
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
  it("should return all productionBatches sorted according to sortBy and order", async () => {
    const res: PaginatedProductionBatchesResponse = await auth().get(
      "/productionBatches?sortBy=occurredAt&order=desc",
    );
    const sorted = createdProductionBatches.toSorted(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
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
describe("GET /productionBatches/:id", () => {
  let createdProductionBatch: ProductionBatch;
  beforeAll(async () => {
    await prisma.productionBatch.deleteMany({});
    createdProductionBatch = await prisma.productionBatch.create({
      data: mockProductionBatches[0],
    });
  });
  it("should return productionBatch given valid id", async () => {
    const id = createdProductionBatch.id;
    const res: ProductionBatchResponse = await auth().get(
      `/productionBatches/${id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdProductionBatch) });
  });
  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/productionBatches/badId");
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
  it("should fail if productionBatch isn't found", async () => {
    const res: ErrorResponse = await auth().get("/productionBatches/999999999");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionBatch not found");
  });
});
describe("POST /productionBatches", () => {
  beforeAll(async () => {
    await prisma.productionBatch.deleteMany({});
  });
  it("should create productionBatch successfully given valid data", async () => {
    const res: ProductionBatchResponse = await auth()
      .post("/productionBatches")
      .send(mockProductionBatches[0]);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(json({ data: mockProductionBatches[0] }));
  });
  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/productionBatches")
      .send({ productionEntryId: -1, quantity: -1, occurredAt: "badDate" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["productionEntryId"],
      },
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
      { key: "body", message: "Invalid DateTime", path: ["occurredAt"] },
    ]);
  });
  it("should fail if productionEntry isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/productionBatches")
      .send({ ...mockProductionBatches[0], productionEntryId: 99999999 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No productionEntry exists with that ID");
  });
});
describe("PATCH /productionBatches/:id", () => {
  let createdProductionBatch: ProductionBatch;
  beforeAll(async () => {
    await prisma.productionBatch.deleteMany({});
    createdProductionBatch = await prisma.productionBatch.create({
      data: mockProductionBatches[0],
    });
  });
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdProductionBatch.id;
    const res: ProductionBatchResponse = await auth()
      .patch(`/productionBatches/${id}`)
      .send({ quantity: 50 });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...createdProductionBatch, quantity: 50 }),
        updatedAt: expect.any(String),
      },
    });
  });
  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionBatches/badId")
      .send({ quantity: 50 });
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
  it("should fail if productionBatch isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionBatches/99999999")
      .send({ quantity: 50 });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionBatch not found");
  });
  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionBatches/${createdProductionBatch.id}`)
      .send({ quantity: -1 });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
    ]);
  });
  it("should fail if productionEntry is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionBatches/${createdProductionBatch.id}`)
      .send({ productionEntryId: 99999999 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No productionEntry exists with that ID");
  });
});
describe("DELETE /productionBatches/:id", () => {
  let createdProductionBatch: ProductionBatch;
  beforeAll(async () => {
    await prisma.productionBatch.deleteMany({});
    createdProductionBatch = await prisma.productionBatch.create({
      data: mockProductionBatches[0],
    });
  });
  it("should delete successfully given valid id", async () => {
    const id = createdProductionBatch.id;
    const res: ProductionBatchResponse = await auth().delete(
      `/productionBatches/${id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdProductionBatch) });
    const res2: ErrorResponse = await auth().get(`/productionBatches/${id}`);
    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ProductionBatch not found");
  });
  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/productionBatches/badId");
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
  it("should fail if productionBatch isn't found", async () => {
    const res: ErrorResponse = await auth().delete(
      "/productionBatches/99999999",
    );
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionBatch not found");
  });
});
afterAll(async () => {
  await prisma.productionBatch.deleteMany({});
  await prisma.productionEntry.deleteMany({});
  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
