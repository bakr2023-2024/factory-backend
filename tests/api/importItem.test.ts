import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  ImportItem,
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

type ImportItemResponse = DataResponse<ImportItem>;
type PaginatedImportItemsResponse = PaginationResponse<ImportItem[]>;
type PaginatedStockMovementResponse = PaginationResponse<StockMovement[]>;
let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /importItems", () => {
  it("should return all importItems", async () => {
    const res: PaginatedImportItemsResponse = await auth().get("/importItems");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.importItems,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.importItems.length / 20),
        totalCount: seed.importItems.length,
      }),
    );
  });

  it("should return paginated importItems given page and size", async () => {
    const res: PaginatedImportItemsResponse = await auth().get(
      "/importItems?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.importItems.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.importItems.length / 2),
        totalCount: seed.importItems.length,
      }),
    );
  });

  it("should return all importItems that relate to queried supplierName and max price", async () => {
    const supplier = seed.suppliers[0];
    const maxPrice = 7;
    const res: PaginatedImportItemsResponse = await auth().get(
      `/importItems?supplierName=${encodeURIComponent(supplier.name)}&maxPrice=${maxPrice}`,
    );
    const filtered = seed.importItems.filter((importItem) => {
      if (importItem.unitPrice.toNumber() > maxPrice) return false;
      const importRow = seed.imports.find((i) => i.id === importItem.importId);
      return importRow?.supplierId === supplier.id;
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

  it("should return all importItems sorted according to sortBy and order", async () => {
    const res: PaginatedImportItemsResponse = await auth().get(
      "/importItems?sortBy=unitPrice&order=desc",
    );
    const sorted = seed.importItems.toSorted((a, b) =>
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

describe("GET /importItems/:id", () => {
  it("should return importItem given valid id", async () => {
    const importItem = seed.importItems[0];
    const res: ImportItemResponse = await auth().get(
      `/importItems/${importItem.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(importItem) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/importItems/badId");

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

  it("should fail if importItem isn't found", async () => {
    const res: ErrorResponse = await auth().get("/importItems/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ImportItem not found");
  });
});

describe("POST /importItems", () => {
  it("should create importItem successfully given variantId and importId and quantity and unitPrice optionally", async () => {
    const payload = {
      importId: seed.imports[2].id,
      variantId: seed.variants[1].id,
      quantity: 7,
      unitPrice: 5.5,
    };
    const res: ImportItemResponse = await auth()
      .post("/importItems")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=IMPORT_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "IMPORT_ITEM",
      quantityChanged: payload.quantity,
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/importItems")
      .send({ importId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["importId"],
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

  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await auth().post("/importItems").send({
      importId: 99999999,
      variantId: seed.variants[3].id,
      quantity: 7,
      unitPrice: 5.5,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No import/variant exists with that ID");
  });

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await auth().post("/importItems").send({
      importId: seed.imports[2].id,
      variantId: 99999999,
      quantity: 7,
      unitPrice: 5.5,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No import/variant exists with that ID");
  });
});

describe("PATCH /importItems/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const importItem = seed.importItems[0];
    const res: ImportItemResponse = await auth()
      .patch(`/importItems/${importItem.id}`)
      .send({ quantity: 67 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...importItem, quantity: 67 }),
        updatedAt: expect.any(String),
      },
    });
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=IMPORT_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "IMPORT_ITEM",
      quantityChanged: 67,
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/importItems/badId")
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

  it("should fail if importItem isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/importItems/99999999")
      .send({ unitPrice: 99.5 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ImportItem not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/importItems/${seed.importItems[0].id}`)
      .send({ importId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["importId"],
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

  it("should fail if import is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/importItems/${seed.importItems[0].id}`)
      .send({ importId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No import/variant exists with that ID");
  });

  it("should fail if variant is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/importItems/${seed.importItems[0].id}`)
      .send({ variantId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No import/variant exists with that ID");
  });
  it("should fail if updated quantity is less than returned item quantity", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/importItems/${seed.importItems[0].id}`)
      .send({ quantity: 1 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "returned quantity can't be more than imported quantity",
    );
  });
});

describe("DELETE /importItems/:id", () => {
  it("should delete successfully given valid id", async () => {
    const importItem = seed.importItems[3];
    const res: ImportItemResponse = await auth().delete(
      `/importItems/${importItem.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(importItem) });

    const res2: ErrorResponse = await auth().get(
      `/importItems/${importItem.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ImportItem not found");
    const res3: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=IMPORT_ITEM&typeRef=${res.body.data.id}`,
    );
    expect(res3.status).toBe(200);
    expect(res3.body.data.length).toBe(0);
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/importItems/badId");

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

  it("should fail if importItem isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/importItems/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ImportItem not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
