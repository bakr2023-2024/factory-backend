import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("config", ".env.dev") });

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { StockMovement } from "../../src/db/generated/prisma/client";
import { StockMovementType } from "../../src/db/generated/prisma/enums";
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

type StockMovementResponse = DataResponse<StockMovement>;
type PaginatedStockMovementsResponse = PaginationResponse<StockMovement[]>;

let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /stockMovements", () => {
  it("should return all stockMovements", async () => {
    const size = 30;
    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?size=${size}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.stockMovements,
        page: 1,
        size,
        totalPages: Math.ceil(seed.stockMovements.length / size),
        totalCount: seed.stockMovements.length,
      }),
    );
  });

  it("should return paginated stockMovements given page and size", async () => {
    const page = 2;
    const size = 2;
    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?page=${page}&size=${size}`,
    );

    const paginated = seed.stockMovements.slice((page - 1) * size, page * size);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: paginated,
        page,
        size,
        totalPages: Math.ceil(seed.stockMovements.length / size),
        totalCount: seed.stockMovements.length,
      }),
    );
  });

  it("should return all stockMovements given itemName", async () => {
    const itemName = seed.items[0].name;

    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?itemName=${encodeURIComponent(itemName)}`,
    );

    const variantIds = seed.variants
      .filter((variant) =>
        seed.items.some(
          (item) => item.id === variant.itemId && item.name === itemName,
        ),
      )
      .map((variant) => variant.id);

    const filtered = [...seed.stockMovements]
      .filter((movement) => variantIds.includes(movement.variantId))
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

  it("should return all stockMovements given type", async () => {
    const type = StockMovementType.IMPORT_ITEM;

    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?type=${type}`,
    );

    const filtered = [...seed.stockMovements]
      .filter((movement) => movement.type === type)
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

  it("should return all stockMovements given type and typeRef", async () => {
    const stockMovement = seed.stockMovements.find(
      (movement) =>
        movement.type === StockMovementType.IMPORT_ITEM &&
        movement.typeRef !== null,
    );

    expect(stockMovement).toBeDefined();

    const { type, typeRef } = stockMovement!;

    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?type=${type}&typeRef=${typeRef}`,
    );

    const filtered = [...seed.stockMovements]
      .filter(
        (movement) => movement.type === type && movement.typeRef === typeRef,
      )
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

  it("should fail given typeRef but not type", async () => {
    const typeRef = seed.stockMovements[0].typeRef;

    const res: ErrorResponse = await auth().get(
      `/stockMovements?typeRef=${typeRef}`,
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "query",
        message: "A type is needed for typeRef to reference",
        path: ["typeRef"],
      },
    ]);
  });

  it("should return all stockMovements sorted according to sortBy and order", async () => {
    const size = 30;
    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?sortBy=occurredAt&order=desc&size=${size}`,
    );

    const sorted = [...seed.stockMovements].sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: sorted,
        page: 1,
        size,
        totalPages: Math.ceil(sorted.length / size),
        totalCount: sorted.length,
      }),
    );
  });

  it("should return all stockMovements given occurredFrom and occurredTo", async () => {
    const size = 30;
    const timestamps = seed.stockMovements.map((movement) =>
      movement.occurredAt.getTime(),
    );
    const occurredFrom = new Date(Math.min(...timestamps)).toISOString();
    const occurredTo = new Date(Math.max(...timestamps)).toISOString();

    const res: PaginatedStockMovementsResponse = await auth().get(
      `/stockMovements?occurredFrom=${encodeURIComponent(
        occurredFrom,
      )}&occurredTo=${encodeURIComponent(occurredTo)}&size=${size}`,
    );

    const filtered = [...seed.stockMovements]
      .filter(
        (movement) =>
          movement.occurredAt >= new Date(occurredFrom) &&
          movement.occurredAt <= new Date(occurredTo),
      )
      .sort((a, b) => a.id - b.id);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size,
        totalPages: Math.ceil(filtered.length / size),
        totalCount: filtered.length,
      }),
    );
  });
});

describe("GET /stockMovements/:id", () => {
  it("should return stockMovement given valid id", async () => {
    const stockMovement = seed.stockMovements[0];

    const res: StockMovementResponse = await auth().get(
      `/stockMovements/${stockMovement.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(stockMovement),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/stockMovements/badId");

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

  it("should fail if stockMovement isn't found", async () => {
    const res: ErrorResponse = await auth().get("/stockMovements/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("StockMovement not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
