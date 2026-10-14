import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("config", ".env.dev") });

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { ProductionEntry } from "../../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../../src/utils/types/response.types";
import {
  auth,
  cleanDatabase,
  json,
  login,
  MockData,
  populateDatabase,
} from "../utils";
import prisma from "../../src/db/prisma";

type ProductionEntryResponse = DataResponse<ProductionEntry>;
type PaginatedProductionEntriesResponse = PaginationResponse<ProductionEntry[]>;

let seed: MockData;

async function createTestProductionDay(productionDate: string) {
  return prisma.productionDay.create({
    data: {
      productionDate: new Date(`${productionDate}T00:00:00.000Z`),
      startedAt: new Date(`${productionDate}T08:00:00.000Z`),
      weekId: seed.weeks[0].id,
    },
  });
}

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /productionEntries", () => {
  it("should return all productionEntries", async () => {
    const expected = [...seed.productionEntries].sort((a, b) => a.id - b.id);

    const res: PaginatedProductionEntriesResponse =
      await auth().get("/productionEntries");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: expected,
        page: 1,
        size: 20,
        totalPages: Math.ceil(expected.length / 20),
        totalCount: expected.length,
      }),
    );
  });

  it("should return paginated productionEntries given page and size", async () => {
    const page = 2;
    const size = 2;
    const expected = [...seed.productionEntries]
      .sort((a, b) => a.id - b.id)
      .slice((page - 1) * size, page * size);

    const res: PaginatedProductionEntriesResponse = await auth().get(
      `/productionEntries?page=${page}&size=${size}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: expected,
        page,
        size,
        totalPages: Math.ceil(seed.productionEntries.length / size),
        totalCount: seed.productionEntries.length,
      }),
    );
  });

  it("should return all productionEntries that relate to queried item name", async () => {
    const itemName = seed.items[0].name;

    const res: PaginatedProductionEntriesResponse = await auth().get(
      `/productionEntries?itemName=${encodeURIComponent(itemName)}`,
    );

    const variantIds = seed.variants
      .filter((variant) =>
        seed.items.some(
          (item) => item.id === variant.itemId && item.name === itemName,
        ),
      )
      .map((variant) => variant.id);

    const filtered = [...seed.productionEntries]
      .filter((entry) => variantIds.includes(entry.variantId))
      .sort((a, b) => a.id - b.id);

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

  it("should return all productionEntries sorted according to sortBy and order", async () => {
    const res: PaginatedProductionEntriesResponse = await auth().get(
      "/productionEntries?sortBy=createdAt&order=desc",
    );

    const sorted = [...seed.productionEntries].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

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

describe("GET /productionEntries/:id", () => {
  it("should return productionEntry given valid id", async () => {
    const productionEntry = seed.productionEntries[0];

    const res: ProductionEntryResponse = await auth().get(
      `/productionEntries/${productionEntry.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(productionEntry) });
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
  let productionDayId: number;

  beforeAll(async () => {
    const productionDay = await createTestProductionDay("2098-01-01");
    productionDayId = productionDay.id;
  });

  it("should create productionEntry successfully given valid data", async () => {
    const body = {
      productionDayId,
      variantId: seed.variants[0].id,
    };

    const res: ProductionEntryResponse = await auth()
      .post("/productionEntries")
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(json({ data: body }));
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
      .send({
        productionDayId: 99999999,
        variantId: seed.variants[0].id,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });

  it("should fail if variant isn't found", async () => {
    const productionDay = await createTestProductionDay("2098-01-02");

    const res: ErrorResponse = await auth()
      .post("/productionEntries")
      .send({
        productionDayId: productionDay.id,
        variantId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
});

describe("PATCH /productionEntries/:id", () => {
  let productionDayId: number;

  beforeAll(async () => {
    const productionDay = await createTestProductionDay("2098-02-01");
    productionDayId = productionDay.id;
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const productionEntry = seed.productionEntries[0];

    const res: ProductionEntryResponse = await auth()
      .patch(`/productionEntries/${productionEntry.id}`)
      .send({ productionDayId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...productionEntry,
          productionDayId,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionEntries/badId")
      .send({ productionDayId });

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
      .send({ productionDayId });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionEntry not found");
  });

  it("should fail given invalid data", async () => {
    const productionEntry = seed.productionEntries[0];

    const res: ErrorResponse = await auth()
      .patch(`/productionEntries/${productionEntry.id}`)
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
    const productionEntry = seed.productionEntries[0];

    const res: ErrorResponse = await auth()
      .patch(`/productionEntries/${productionEntry.id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });

  it("should fail if variant is not found", async () => {
    const productionEntry = seed.productionEntries[0];

    const res: ErrorResponse = await auth()
      .patch(`/productionEntries/${productionEntry.id}`)
      .send({ variantId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
});

describe("DELETE /productionEntries/:id", () => {
  let productionEntry: ProductionEntry;

  beforeAll(async () => {
    const productionDay = await createTestProductionDay("2098-03-01");

    productionEntry = await prisma.productionEntry.create({
      data: {
        productionDayId: productionDay.id,
        variantId: seed.variants[0].id,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const res: ProductionEntryResponse = await auth().delete(
      `/productionEntries/${productionEntry.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(productionEntry) });

    const res2: ErrorResponse = await auth().get(
      `/productionEntries/${productionEntry.id}`,
    );

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
  await cleanDatabase();
  await prisma.$disconnect();
});
