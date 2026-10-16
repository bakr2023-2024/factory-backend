import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  ExportItem,
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

type ExportItemResponse = DataResponse<ExportItem>;
type PaginatedExportItemsResponse = PaginationResponse<ExportItem[]>;
type PaginatedStockMovementResponse = PaginationResponse<StockMovement[]>;
let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /exportItems", () => {
  it("should return all exportItems", async () => {
    const res: PaginatedExportItemsResponse = await auth().get("/exportItems");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.exportItems,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.exportItems.length / 20),
        totalCount: seed.exportItems.length,
      }),
    );
  });

  it("should return paginated exportItems given page and size", async () => {
    const res: PaginatedExportItemsResponse = await auth().get(
      "/exportItems?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.exportItems.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.exportItems.length / 2),
        totalCount: seed.exportItems.length,
      }),
    );
  });

  it("should return all exportItems that relate to queried customerName and max price", async () => {
    const customer = seed.customers[0];
    const maxPrice = 10;
    const res: PaginatedExportItemsResponse = await auth().get(
      `/exportItems?customerName=${encodeURIComponent(customer.name)}&maxPrice=${maxPrice}`,
    );
    const filtered = seed.exportItems.filter((exportItem) => {
      if (exportItem.unitPrice.toNumber() > maxPrice) return false;
      const exportRow = seed.exports.find((e) => e.id === exportItem.exportId);
      return exportRow?.customerId === customer.id;
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

  it("should return all exportItems sorted according to sortBy and order", async () => {
    const res: PaginatedExportItemsResponse = await auth().get(
      "/exportItems?sortBy=unitPrice&order=desc",
    );
    const sorted = seed.exportItems.toSorted((a, b) =>
      b.unitPrice.comparedTo(a.unitPrice),
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

describe("GET /exportItems/:id", () => {
  it("should return exportItem given valid id", async () => {
    const exportItem = seed.exportItems[0];
    const res: ExportItemResponse = await auth().get(
      `/exportItems/${exportItem.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(exportItem) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/exportItems/badId");

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

  it("should fail if exportItem isn't found", async () => {
    const res: ErrorResponse = await auth().get("/exportItems/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ExportItem not found");
  });
});

describe("POST /exportItems", () => {
  it("should create exportItem given valid data", async () => {
    const payload = {
      exportId: seed.exports[2].id,
      variantId: seed.variants[1].id,
      quantity: 7,
      unitPrice: 5.5,
    };
    const res: ExportItemResponse = await auth()
      .post("/exportItems")
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });

    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=EXPORT_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "EXPORT_ITEM",
      quantityChanged: -payload.quantity,
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/exportItems")
      .send({ exportId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["exportId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["variantId"],
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

  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await auth().post("/exportItems").send({
      exportId: 99999999,
      variantId: seed.variants[3].id,
      quantity: 7,
      unitPrice: 5.5,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No export/variant exists with that ID");
  });

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await auth().post("/exportItems").send({
      exportId: seed.exports[2].id,
      variantId: 99999999,
      quantity: 7,
      unitPrice: 5.5,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No export/variant exists with that ID");
  });
});

describe("PATCH /exportItems/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const exportItem = seed.exportItems[0];
    const res: ExportItemResponse = await auth()
      .patch(`/exportItems/${exportItem.id}`)
      .send({ quantity: 67 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...exportItem, quantity: 67 }),
        updatedAt: expect.any(String),
      },
    });
                const res2: PaginatedStockMovementResponse = await auth().get(
                  `/stockMovements?type=EXPORT_ITEM&typeRef=${res.body.data.id}`,
                );
                expect(res2.status).toBe(200);
                expect(res2.body.data[0]).toMatchObject({
                  typeRef: res.body.data.id,
                  type: "EXPORT_ITEM",
                  quantityChanged: -67,
                });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/exportItems/badId")
      .send({ unitPrice: 99.5 });

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

  it("should fail if exportItem isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/exportItems/99999999")
      .send({ unitPrice: 99.5 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ExportItem not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/exportItems/${seed.exportItems[0].id}`)
      .send({ exportId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["exportId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["variantId"],
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

  it("should fail if export is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/exportItems/${seed.exportItems[0].id}`)
      .send({ exportId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No export/variant exists with that ID");
  });

  it("should fail if variant is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/exportItems/${seed.exportItems[0].id}`)
      .send({ variantId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No export/variant exists with that ID");
  });
});

describe("DELETE /exportItems/:id", () => {
  it("should delete successfully given valid id", async () => {
    const exportItem = seed.exportItems[3];
    const res: ExportItemResponse = await auth().delete(
      `/exportItems/${exportItem.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(exportItem) });

    const res2: ErrorResponse = await auth().get(
      `/exportItems/${exportItem.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ExportItem not found");
    const res3: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=EXPORT_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res3.status).toBe(200);
    expect(res3.body.data.length).toBe(0);
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/exportItems/badId");

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

  it("should fail if exportItem isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/exportItems/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ExportItem not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
