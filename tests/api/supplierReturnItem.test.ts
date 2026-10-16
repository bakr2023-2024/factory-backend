import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  StockMovement,
  SupplierReturnItem,
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

type SupplierReturnItemResponse = DataResponse<SupplierReturnItem>;
type PaginatedSupplierReturnItemsResponse = PaginationResponse<
  SupplierReturnItem[]
>;
type PaginatedStockMovementResponse = PaginationResponse<StockMovement[]>;
let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /supplierReturnItems", () => {
  it("should return all supplier return items", async () => {
    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      "/supplierReturnItems",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.supplierReturnItems,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.supplierReturnItems.length / 20),
        totalCount: seed.supplierReturnItems.length,
      }),
    );
  });

  it("should return paginated supplier return items given page and size", async () => {
    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      "/supplierReturnItems?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.supplierReturnItems.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.supplierReturnItems.length / 2),
        totalCount: seed.supplierReturnItems.length,
      }),
    );
  });

  it("should return all supplier return items given supplierReturnId", async () => {
    const supplierReturnId = seed.supplierReturns[0].id;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierReturnId=${supplierReturnId}`,
    );

    const filtered = seed.supplierReturnItems.filter(
      (item) => item.supplierReturnId === supplierReturnId,
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

  it("should return all supplier return items given supplierId", async () => {
    const supplierId = seed.suppliers[0].id;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierId=${supplierId}`,
    );

    const supplierReturnIds = seed.supplierReturns
      .filter((supplierReturn) => supplierReturn.supplierId === supplierId)
      .map((supplierReturn) => supplierReturn.id);

    const filtered = seed.supplierReturnItems.filter((item) =>
      supplierReturnIds.includes(item.supplierReturnId),
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

  it("should return all supplier return items given importItemId", async () => {
    const importItemId = seed.importItems[0].id;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?importItemId=${importItemId}`,
    );

    const filtered = seed.supplierReturnItems.filter(
      (item) => item.importItemId === importItemId,
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

  it("should return all supplier return items given supplierName", async () => {
    const supplierName = seed.suppliers[0].name;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierName=${encodeURIComponent(supplierName)}`,
    );

    const supplierIds = seed.suppliers
      .filter((supplier) => supplier.name === supplierName)
      .map((supplier) => supplier.id);

    const supplierReturnIds = seed.supplierReturns
      .filter((supplierReturn) =>
        supplierIds.includes(supplierReturn.supplierId),
      )
      .map((supplierReturn) => supplierReturn.id);

    const filtered = seed.supplierReturnItems.filter((item) =>
      supplierReturnIds.includes(item.supplierReturnId),
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

  it("should return all supplier return items given supplierNumber", async () => {
    const supplierNumber = seed.suppliers[1].number;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierNumber=${supplierNumber}`,
    );

    const supplierIds = seed.suppliers
      .filter((supplier) => supplier.number === supplierNumber)
      .map((supplier) => supplier.id);

    const supplierReturnIds = seed.supplierReturns
      .filter((supplierReturn) =>
        supplierIds.includes(supplierReturn.supplierId),
      )
      .map((supplierReturn) => supplierReturn.id);

    const filtered = seed.supplierReturnItems.filter((item) =>
      supplierReturnIds.includes(item.supplierReturnId),
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

  it("should return all supplier return items given itemName", async () => {
    const itemName = seed.items[0].name;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?itemName=${encodeURIComponent(itemName)}`,
    );

    const variantIds = seed.variants
      .filter((variant) => variant.itemId === seed.items[0].id)
      .map((variant) => variant.id);

    const importItemIds = seed.importItems
      .filter((importItem) => variantIds.includes(importItem.variantId))
      .map((importItem) => importItem.id);

    const filtered = seed.supplierReturnItems.filter((item) =>
      importItemIds.includes(item.importItemId),
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

  it("should return all supplier return items given unitWeight", async () => {
    const unitWeight = 5;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?unitWeight=${unitWeight}`,
    );

    const variantIds = seed.variants
      .filter((variant) => variant.unitWeight.toNumber() === unitWeight)
      .map((variant) => variant.id);

    const importItemIds = seed.importItems
      .filter((importItem) => variantIds.includes(importItem.variantId))
      .map((importItem) => importItem.id);

    const filtered = seed.supplierReturnItems.filter((item) =>
      importItemIds.includes(item.importItemId),
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

  it("should return all supplier return items given quantity", async () => {
    const quantity = 4;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?quantity=${quantity}`,
    );

    const filtered = seed.supplierReturnItems.filter(
      (item) => item.quantity === quantity,
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

  it("should return all supplier return items given minPrice", async () => {
    const minPrice = 3;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?minPrice=${minPrice}`,
    );

    const filtered = seed.supplierReturnItems.filter(
      (item) => item.unitPrice.toNumber() >= minPrice,
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

  it("should return all supplier return items given maxPrice", async () => {
    const maxPrice = 3;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?maxPrice=${maxPrice}`,
    );

    const filtered = seed.supplierReturnItems.filter(
      (item) => item.unitPrice.toNumber() <= maxPrice,
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

  it("should return all supplier return items given minPrice and maxPrice", async () => {
    const minPrice = 1.5;
    const maxPrice = 3;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?minPrice=${minPrice}&maxPrice=${maxPrice}`,
    );

    const filtered = seed.supplierReturnItems.filter(
      (item) =>
        item.unitPrice.toNumber() >= minPrice &&
        item.unitPrice.toNumber() <= maxPrice,
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
});

describe("GET /supplierReturnItems/:id", () => {
  it("should return supplier return item given valid id", async () => {
    const item = seed.supplierReturnItems[0];

    const res: SupplierReturnItemResponse = await auth().get(
      `/supplierReturnItems/${item.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(item) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/supplierReturnItems/badId");

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

  it("should fail if supplier return item isn't found", async () => {
    const res: ErrorResponse = await auth().get(
      "/supplierReturnItems/999999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturnItem not found");
  });
});

describe("POST /supplierReturnItems", () => {
  it("should create supplier return item successfully given valid data", async () => {
    const payload = {
      supplierReturnId: seed.supplierReturns[0].id,
      importItemId: seed.importItems[3].id,
      quantity: 7,
      unitPrice: 5.5,
    };

    const res: SupplierReturnItemResponse = await auth()
      .post("/supplierReturnItems")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=SUPPLIER_RETURN_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "SUPPLIER_RETURN_ITEM",
      quantityChanged: -payload.quantity,
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/supplierReturnItems").send({
      supplierReturnId: -1,
      importItemId: -1,
      quantity: -1,
      unitPrice: -1,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["supplierReturnId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["importItemId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["quantity"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["unitPrice"],
      },
    ]);
  });

  it("should fail if supplierReturn/importItem aren't found", async () => {
    const res: ErrorResponse = await auth().post("/supplierReturnItems").send({
      supplierReturnId: 99999999,
      importItemId: 99999999,
      quantity: 7,
      unitPrice: 5.5,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplierReturn/importItem exists with that ID",
    );
  });
});

describe("PATCH /supplierReturnItems/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const item = seed.supplierReturnItems[0];

    const res: SupplierReturnItemResponse = await auth()
      .patch(`/supplierReturnItems/${item.id}`)
      .send({ quantity: 50 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...item, quantity: 50 }),
        updatedAt: expect.any(String),
      },
    });
        const res2: PaginatedStockMovementResponse = await auth().get(
          `/stockMovements?type=SUPPLIER_RETURN_ITEM&typeRef=${res.body.data.id}`,
        );
        expect(res2.status).toBe(200);
        expect(res2.body.data[0]).toMatchObject({
          typeRef: res.body.data.id,
          type: "SUPPLIER_RETURN_ITEM",
          quantityChanged: -50,
        });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/supplierReturnItems/badId")
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

  it("should fail if supplier return item isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/supplierReturnItems/99999999")
      .send({ quantity: 50 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturnItem not found");
  });

  it("should fail given invalid data", async () => {
    const item = seed.supplierReturnItems[0];

    const res: ErrorResponse = await auth()
      .patch(`/supplierReturnItems/${item.id}`)
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

  it("should fail if supplierReturn/importItem aren't found", async () => {
    const item = seed.supplierReturnItems[0];

    const res: ErrorResponse = await auth()
      .patch(`/supplierReturnItems/${item.id}`)
      .send({
        supplierReturnId: 99999999,
        importItemId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplierReturn/importItem exists with that ID",
    );
  });
});

describe("DELETE /supplierReturnItems/:id", () => {
  it("should delete successfully given valid id", async () => {
    const item = seed.supplierReturnItems[2];

    const res: SupplierReturnItemResponse = await auth().delete(
      `/supplierReturnItems/${item.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(item) });

    const res2: ErrorResponse = await auth().get(
      `/supplierReturnItems/${item.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("SupplierReturnItem not found");
    const res3: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=SUPPLIER_RETURN_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res3.status).toBe(200);
    expect(res3.body.data.length).toBe(0);
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete(
      "/supplierReturnItems/badId",
    );

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

  it("should fail if supplier return item isn't found", async () => {
    const res: ErrorResponse = await auth().delete(
      "/supplierReturnItems/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturnItem not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
