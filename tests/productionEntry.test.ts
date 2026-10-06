import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Item,
  ItemType,
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

type ProductionEntryResponse = DataResponse<ProductionEntry>;
type PaginatedProductionEntriesResponse = PaginationResponse<ProductionEntry[]>;

const mockSeason = {
  name: "season 1",
  startDate: new Date("2026-09-24T00:00:00Z"),
};
let createdSeason: Season;

const mockWeeks = [
  {
    startDate: new Date("2026-09-24T00:00:00Z"),
  },
  {
    startDate: new Date("2026-09-27T00:00:00Z"),
  },
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
beforeAll(async () => {
  await login();
  await prisma.season.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.productionDay.deleteMany({});
  await prisma.productionEntry.deleteMany({});
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
  mockVariants.push({ itemId: createdItems[0].id, unitWeight: 5 });
  mockVariants.push({ itemId: createdItems[0].id, unitWeight: 7 });
  mockVariants.push({ itemId: createdItems[1].id, unitWeight: 3 });
  createdVariants = await prisma.variant.createManyAndReturn({
    data: mockVariants,
  });
  mockProductionEntries.push({
    productionDayId: createdProductionDays[0].id,
    variantId: createdVariants[0].id,
  });
  mockProductionEntries.push({
    productionDayId: createdProductionDays[0].id,
    variantId: createdVariants[1].id,
  });
  mockProductionEntries.push({
    productionDayId: createdProductionDays[1].id,
    variantId: createdVariants[2].id,
  });
});
describe("GET /productionEntries", () => {
  let createdProductionEntries: ProductionEntry[] = [];

  beforeAll(async () => {
    createdProductionEntries = await prisma.productionEntry.createManyAndReturn(
      {
        data: mockProductionEntries,
      },
    );
  });

  it("should return all productionEntries", async () => {
    const res: PaginatedProductionEntriesResponse =
      await auth().get("/productionEntries");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdProductionEntries,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdProductionEntries.length,
      }),
    );
  });

  it("should return paginated productionEntries given page and size", async () => {
    const res: PaginatedProductionEntriesResponse = await auth().get(
      "/productionEntries?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdProductionEntries[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all productionEntries that relate to queried Name", async () => {
    const res: PaginatedProductionEntriesResponse = await auth().get(
      "/productionEntries?itemName=Fruit%20Tofu",
    );
    const filtered = createdProductionEntries.filter((productionEntry) => {
      const itemId = createdVariants.find(
        (v) => v.id === productionEntry.variantId,
      )!.itemId;
      const item = createdItems.find(
        (i) => i.id == itemId && i.name == "Fruit Tofu",
      );
      return item;
    });
    const expectedRes = json({
      data: filtered,
      page: 1,
      size: 20,
      totalPages: 1,
      totalCount: filtered.length,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedRes);
  });
  it("should return all productionEntries sorted according to sortBy and order", async () => {
    const res: PaginatedProductionEntriesResponse = await auth().get(
      "/productionEntries?sortBy=createdAt&order=desc",
    );
    const sorted = createdProductionEntries.toSorted(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
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

describe("GET /productionEntries/:id", () => {
  let createdProductionEntry: ProductionEntry;

  beforeAll(async () => {
    await prisma.productionEntry.deleteMany({});
    createdProductionEntry = await prisma.productionEntry.create({
      data: mockProductionEntries[0],
    });
  });

  it("should return productionEntry given valid id", async () => {
    const id = createdProductionEntry.id;
    const res: ProductionEntryResponse = await auth().get(
      `/productionEntries/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdProductionEntry) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/productionEntries/badId");

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

  it("should fail if productionEntry isn't found", async () => {
    const res: ErrorResponse = await auth().get("/productionEntries/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionEntry not found");
  });
});

describe("POST /productionEntries", () => {
  beforeAll(async () => {
    await prisma.productionEntry.deleteMany({});
  });

  it("should create productionEntry successfully given valid data", async () => {
    const res: ProductionEntryResponse = await auth()
      .post("/productionEntries")
      .send(mockProductionEntries[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(json({ data: mockProductionEntries[0] }));
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/productionEntries")
      .send({ productionDayId: -1, variantId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["variantId"],
      },
    ]);
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/productionEntries")
      .send({ ...mockProductionEntries[1], productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/productionEntries")
      .send({ ...mockProductionEntries[1], variantId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
});

describe("PATCH /productionEntries/:id", () => {
  let createdProductionEntry: ProductionEntry;
  beforeAll(async () => {
    await prisma.productionEntry.deleteMany({});
    createdProductionEntry = await prisma.productionEntry.create({
      data: mockProductionEntries[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdProductionEntry.id;
    const res: ProductionEntryResponse = await auth()
      .patch(`/productionEntries/${id}`)
      .send({ productionDayId: createdProductionDays[2].id });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdProductionEntry,
          productionDayId: createdProductionDays[2].id,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionEntries/badId")
      .send({ productionDayId: createdProductionDays[2].id });

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
  it("should fail if productionEntry isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionEntries/99999999")
      .send({ productionDayId: createdProductionDays[2].id });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionEntry not found");
  });
  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionEntries/${createdProductionEntry.id}`)
      .send({ productionDayId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["productionDayId"],
      },
    ]);
  });
  it("should fail if productionDay is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionEntries/${createdProductionEntry.id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
  it("should fail if variant is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionEntries/${createdProductionEntry.id}`)
      .send({ variantId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
});

describe("DELETE /productionEntries/:id", () => {
  let createdProductionEntry: ProductionEntry;

  beforeAll(async () => {
    await prisma.productionEntry.deleteMany({});
    createdProductionEntry = await prisma.productionEntry.create({
      data: mockProductionEntries[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdProductionEntry.id;
    const res: ProductionEntryResponse = await auth().delete(
      `/productionEntries/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdProductionEntry) });

    const res2: ErrorResponse = await auth().get(`/productionEntries/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ProductionEntry not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/productionEntries/badId");

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

  it("should fail if productionEntry isn't found", async () => {
    const res: ErrorResponse = await auth().delete(
      "/productionEntries/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionEntry not found");
  });
});

afterAll(async () => {
  await prisma.productionEntry.deleteMany({});
  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
