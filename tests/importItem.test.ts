import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Import,
  ImportItem,
  Item,
  ItemType,
  Supplier,
  Variant,
} from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type ImportItemResponse = DataResponse<ImportItem>;
type PaginatedImportItemsResponse = PaginationResponse<ImportItem[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];
let createdItems: Item[];
const mockVariants: { itemId: number; unitWeight: number }[] = [];
let createdVariants: Variant[] = [];
const mockSuppliers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08885000" },
];
let createdSuppliers: Supplier[];
let mockImports: {
  supplierId: number;
}[] = [];
let createdImports: Import[] = [];
const mockImportItems: {
  importId: number;
  variantId: number;
  quantity: number;
  unitPrice?: number;
  createdAt: Date;
}[] = [];
beforeAll(async () => {
  createdItems = await prisma.item.createManyAndReturn({
    data: mockItems,
  });
  mockVariants.push({ itemId: createdItems[0].id, unitWeight: 5 });
  mockVariants.push({ itemId: createdItems[0].id, unitWeight: 7 });
  mockVariants.push({ itemId: createdItems[1].id, unitWeight: 5 });
  createdVariants = await prisma.variant.createManyAndReturn({
    data: mockVariants,
  });
  createdSuppliers = await prisma.supplier.createManyAndReturn({
    data: mockSuppliers,
  });
  mockImports.push({
    supplierId: createdSuppliers[0].id,
  });
  mockImports.push({
    supplierId: createdSuppliers[0].id,
  });
  mockImports.push({
    supplierId: createdSuppliers[1].id,
  });
  createdImports = await prisma.import.createManyAndReturn({
    data: mockImports,
  });
  mockImportItems.push({
    importId: createdImports[0].id,
    variantId: createdVariants[0].id,
    quantity: 5,
    unitPrice: 23.4,
    createdAt: new Date("2025-09-13T12:00:00Z"),
  });
  mockImportItems.push({
    importId: createdImports[0].id,
    variantId: createdVariants[1].id,
    quantity: 3,
    unitPrice: 25.2,
    createdAt: new Date("2025-09-17T10:00:00Z"),
  });
  mockImportItems.push({
    importId: createdImports[1].id,
    variantId: createdVariants[1].id,
    quantity: 4,
    unitPrice: 20.5,
    createdAt: new Date("2025-09-15T08:00:00Z"),
  });
});
describe("GET /importItems", () => {
  let createdImportItems: ImportItem[] = [];

  beforeAll(async () => {
    await prisma.importItem.deleteMany({});
    createdImportItems = await prisma.importItem.createManyAndReturn({
      data: mockImportItems,
    });
  });

  it("should return all importItems", async () => {
    const res: PaginatedImportItemsResponse =
      await request(app).get("/importItems");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdImportItems,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdImportItems.length,
      }),
    );
  });

  it("should return paginated importItems given page and size", async () => {
    const res: PaginatedImportItemsResponse = await request(app).get(
      "/importItems?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdImportItems[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all importItems that relate to queried supplierName and max price", async () => {
    const queriedName = createdSuppliers[0].name;
    const res: PaginatedImportItemsResponse = await request(app).get(
      `/importItems?supplierName=${queriedName}&maxPrice=22`,
    );
    const filtered = createdImportItems.filter((importItem) => {
      if (importItem.unitPrice.comparedTo(22) == 1) return false;
      const supplierId = createdImports.find(
        (i) => i.id == importItem.importId,
      )?.supplierId;
      if (!supplierId) return false;
      return createdSuppliers.find(
        (s) => s.id === supplierId && s.name.includes(queriedName),
      );
    });
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
  it("should return all importItems sorted according to sortBy and order", async () => {
    const res: PaginatedImportItemsResponse = await request(app).get(
      "/importItems?sortBy=unitPrice&order=desc",
    );
    const sorted = createdImportItems.toSorted((a, b) =>
      b.unitPrice.comparedTo(a.unitPrice),
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

describe("GET /importItems/:id", () => {
  let createdImportItem: ImportItem;

  beforeAll(async () => {
    await prisma.importItem.deleteMany({});
    createdImportItem = await prisma.importItem.create({
      data: mockImportItems[0],
    });
  });

  it("should return importItem given valid id", async () => {
    const id = createdImportItem.id;
    const res: ImportItemResponse = await request(app).get(
      `/importItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdImportItem) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/importItems/badId");

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

  it("should fail if importItem isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/importItems/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ImportItem not found");
  });
});

describe("POST /importItems", () => {
  beforeAll(async () => {
    await prisma.importItem.deleteMany({});
  });

  it("should create importItem successfully given variantId and importId and quantity and unitPrice optionally", async () => {
    const { variantId, importId, quantity, unitPrice } = mockImportItems[0];
    const res: ImportItemResponse = await request(app)
      .post("/importItems")
      .send({ variantId, importId, quantity, unitPrice });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: { variantId, importId, quantity, unitPrice },
    });
  });

  it("should fail given invalid importId or variantId or quantity or unitPrice", async () => {
    const res: ErrorResponse = await request(app)
      .post("/importItems")
      .send({ importId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["importId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["variantId"],
      },
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
      {
        key: "body",
        message: "price can only be a positive number",
        path: ["unitPrice"],
      },
    ]);
  });
});

describe("PATCH /importItems/:id", () => {
  let createdImportItem: ImportItem;
  beforeAll(async () => {
    await prisma.importItem.deleteMany({});
    createdImportItem = await prisma.importItem.create({
      data: mockImportItems[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdImportItem.id;
    const res: ImportItemResponse = await request(app)
      .patch(`/importItems/${id}`)
      .send({ unitPrice: mockImportItems[1].unitPrice });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdImportItem,
          unitPrice: mockImportItems[1].unitPrice,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/importItems/badId")
      .send({ unitPrice: mockImportItems[1].unitPrice });

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
  it("should fail if importItem isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/importItems/99999999")
      .send({ unitPrice: mockImportItems[1].unitPrice });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ImportItem not found");
  });
  it("should fail given invalid importId or variantId or quantity or unitPrice", async () => {
    const res: ErrorResponse = await request(app)
      .patch(`/importItems/${createdImportItem.id}`)
      .send({ importId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["importId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["variantId"],
      },
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
      {
        key: "body",
        message: "price can only be a positive number",
        path: ["unitPrice"],
      },
    ]);
  });
});

describe("DELETE /importItems/:id", () => {
  let createdImportItem: ImportItem;

  beforeAll(async () => {
    await prisma.importItem.deleteMany({});
    createdImportItem = await prisma.importItem.create({
      data: mockImportItems[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdImportItem.id;
    const res: ImportItemResponse = await request(app).delete(
      `/importItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdImportItem) });

    const res2: ErrorResponse = await request(app).get(`/importItems/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ImportItem not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/importItems/badId");

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

  it("should fail if importItem isn't found", async () => {
    const res: ErrorResponse = await request(app).delete(
      "/importItems/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ImportItem not found");
  });
});

afterAll(async () => {
  await prisma.importItem.deleteMany({});
  await prisma.import.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
