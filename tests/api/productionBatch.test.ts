import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  ProductionBatch,
  ProductionEntry,
  StockMovement,
} from "../../src/db/generated/prisma/client";
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

type ProductionBatchResponse = DataResponse<ProductionBatch>;
type PaginatedProductionBatchesResponse = PaginationResponse<ProductionBatch[]>;
type PaginatedStockMovementResponse = PaginationResponse<StockMovement[]>;
let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /productionBatches", () => {
  it("should return all productionBatches", async () => {
    const res: PaginatedProductionBatchesResponse =
      await auth().get("/productionBatches");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.productionBatches,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.productionBatches.length / 20),
        totalCount: seed.productionBatches.length,
      }),
    );
  });

  it("should return paginated productionBatches given page and size", async () => {
    const res: PaginatedProductionBatchesResponse = await auth().get(
      "/productionBatches?page=2&size=2",
    );

    const paginated = seed.productionBatches.slice(2, 4);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: paginated,
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.productionBatches.length / 2),
        totalCount: seed.productionBatches.length,
      }),
    );
  });

  it("should return all productionBatches given productionEntryId", async () => {
    const productionEntryId = seed.productionEntries[0].id;

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?productionEntryId=${productionEntryId}`,
    );

    const filtered = seed.productionBatches.filter(
      (productionBatch) =>
        productionBatch.productionEntryId === productionEntryId,
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

  it("should return all productionBatches given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?productionDayId=${productionDayId}`,
    );

    const productionEntryIds = seed.productionEntries
      .filter(
        (productionEntry) =>
          productionEntry.productionDayId === productionDayId,
      )
      .map((productionEntry) => productionEntry.id);

    const filtered = seed.productionBatches.filter((productionBatch) =>
      productionEntryIds.includes(productionBatch.productionEntryId),
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

  it("should return all productionBatches given productionDate", async () => {
    const productionDate = "2026-09-24";

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?productionDate=${productionDate}`,
    );

    const filtered = seed.productionBatches.filter((productionBatch) => {
      const productionEntry = seed.productionEntries.find(
        (entry) => entry.id === productionBatch.productionEntryId,
      )!;

      const productionDay = seed.productionDays.find(
        (day) => day.id === productionEntry.productionDayId,
      )!;

      return (
        productionDay.productionDate.toISOString().slice(0, 10) ===
        productionDate
      );
    });

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

  it("should return all productionBatches given itemName", async () => {
    const itemName = "Fruit Tofu";

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?itemName=${encodeURIComponent(itemName)}`,
    );

    const filtered = seed.productionBatches.filter((productionBatch) => {
      const productionEntry = seed.productionEntries.find(
        (entry) => entry.id === productionBatch.productionEntryId,
      )!;

      const variant = seed.variants.find(
        (v) => v.id === productionEntry.variantId,
      )!;

      const item = seed.items.find((i) => i.id === variant.itemId);

      return item?.name === itemName;
    });

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

  it("should return all productionBatches given unitWeight", async () => {
    const unitWeight = 5;

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?unitWeight=${unitWeight}`,
    );

    const productionEntryIds = seed.productionEntries
      .filter((productionEntry) => {
        const variant = seed.variants.find(
          (v) => v.id === productionEntry.variantId,
        )!;

        return variant.unitWeight.toNumber() === unitWeight;
      })
      .map((productionEntry) => productionEntry.id);

    const filtered = seed.productionBatches.filter((productionBatch) =>
      productionEntryIds.includes(productionBatch.productionEntryId),
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

  it("should return all productionBatches given occurredFrom", async () => {
    const occurredFrom = "2026-10-01T10:00:00.000Z";

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?occurredFrom=${encodeURIComponent(occurredFrom)}`,
    );

    const filtered = seed.productionBatches.filter(
      (productionBatch) => productionBatch.occurredAt >= new Date(occurredFrom),
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

  it("should return all productionBatches given occurredTo", async () => {
    const occurredTo = "2026-10-01T10:00:00.000Z";

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = seed.productionBatches.filter(
      (productionBatch) => productionBatch.occurredAt <= new Date(occurredTo),
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

  it("should return all productionBatches given occurredFrom and occurredTo", async () => {
    const occurredFrom = "2026-09-24T09:00:00.000Z";
    const occurredTo = "2026-10-01T10:00:00.000Z";

    const res: PaginatedProductionBatchesResponse = await auth().get(
      `/productionBatches?occurredFrom=${encodeURIComponent(occurredFrom)}&occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = seed.productionBatches.filter(
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
        totalPages: Math.ceil(filtered.length / 20),
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all productionBatches sorted according to sortBy and order", async () => {
    const res: PaginatedProductionBatchesResponse = await auth().get(
      "/productionBatches?sortBy=occurredAt&order=desc",
    );

    const sorted = seed.productionBatches.toSorted(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
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

describe("GET /productionBatches/:id", () => {
  it("should return productionBatch given valid id", async () => {
    const productionBatch = seed.productionBatches[0];

    const res: ProductionBatchResponse = await auth().get(
      `/productionBatches/${productionBatch.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(productionBatch) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/productionBatches/badId");

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

  it("should fail if productionBatch isn't found", async () => {
    const res: ErrorResponse = await auth().get("/productionBatches/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionBatch not found");
  });
});

describe("POST /productionBatches", () => {
  it("should create productionBatch successfully given valid data", async () => {
    const payload = {
      productionEntryId: seed.productionEntries[2].id,
      quantity: 40,
      occurredAt: "2026-09-24T12:00:00.000Z",
    };

    const res: ProductionBatchResponse = await auth()
      .post("/productionBatches")
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(json({ data: payload }));
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=PRODUCTION_BATCH&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "PRODUCTION_BATCH",
      quantityChanged: payload.quantity,
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/productionBatches").send({
      productionEntryId: -1,
      quantity: -1,
      occurredAt: "badDate",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionEntryId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["quantity"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
    ]);
  });

  it("should fail if productionEntry isn't found", async () => {
    const res: ErrorResponse = await auth().post("/productionBatches").send({
      productionEntryId: 99999999,
      quantity: 10,
      occurredAt: "2026-09-24T09:00:00.000Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No productionEntry exists with that ID");
  });
});

describe("PATCH /productionBatches/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const productionBatch = seed.productionBatches[0];

    const res: ProductionBatchResponse = await auth()
      .patch(`/productionBatches/${productionBatch.id}`)
      .send({ quantity: 50 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...productionBatch, quantity: 50 }),
        updatedAt: expect.any(String),
      },
    });
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=PRODUCTION_BATCH&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "PRODUCTION_BATCH",
      quantityChanged: 50,
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
        message: "value can only be a positive integer",
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
    const productionBatch = seed.productionBatches[0];

    const res: ErrorResponse = await auth()
      .patch(`/productionBatches/${productionBatch.id}`)
      .send({ quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["quantity"],
      },
    ]);
  });

  it("should fail if productionEntry is not found", async () => {
    const productionBatch = seed.productionBatches[0];

    const res: ErrorResponse = await auth()
      .patch(`/productionBatches/${productionBatch.id}`)
      .send({ productionEntryId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No productionEntry exists with that ID");
  });
});

describe("DELETE /productionBatches/:id", () => {
  it("should delete successfully given valid id", async () => {
    const productionBatch = seed.productionBatches[2];

    const res: ProductionBatchResponse = await auth().delete(
      `/productionBatches/${productionBatch.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(productionBatch) });

    const res2: ErrorResponse = await auth().get(
      `/productionBatches/${productionBatch.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ProductionBatch not found");
    const res3: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=PRODUCTION_BATCH&typeRef=${res.body.data.id}`,
    );
    expect(res3.status).toBe(200);
    expect(res3.body.data.length).toBe(0);
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/productionBatches/badId");

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

  it("should fail if productionBatch isn't found", async () => {
    const res: ErrorResponse = await auth().delete(
      "/productionBatches/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionBatch not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
