import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Export,
  ExportItem,
  Item,
  ItemType,
  Customer,
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

type ExportItemResponse = DataResponse<ExportItem>;
type PaginatedExportItemsResponse = PaginationResponse<ExportItem[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];
let createdItems: Item[];
const mockVariants: { itemId: number; unitWeight: number }[] = [];
let createdVariants: Variant[] = [];
const mockCustomers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08885000" },
];
let createdCustomers: Customer[];
let mockExports: {
  customerId: number;
}[] = [];
let createdExports: Export[] = [];
const mockExportItems: {
  exportId: number;
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
  createdCustomers = await prisma.customer.createManyAndReturn({
    data: mockCustomers,
  });
  mockExports.push({
    customerId: createdCustomers[0].id,
  });
  mockExports.push({
    customerId: createdCustomers[0].id,
  });
  mockExports.push({
    customerId: createdCustomers[1].id,
  });
  createdExports = await prisma.export.createManyAndReturn({
    data: mockExports,
  });
  mockExportItems.push({
    exportId: createdExports[0].id,
    variantId: createdVariants[0].id,
    quantity: 5,
    unitPrice: 23.4,
    createdAt: new Date("2025-09-13T12:00:00Z"),
  });
  mockExportItems.push({
    exportId: createdExports[0].id,
    variantId: createdVariants[1].id,
    quantity: 3,
    unitPrice: 25.2,
    createdAt: new Date("2025-09-17T10:00:00Z"),
  });
  mockExportItems.push({
    exportId: createdExports[1].id,
    variantId: createdVariants[1].id,
    quantity: 4,
    unitPrice: 20.5,
    createdAt: new Date("2025-09-15T08:00:00Z"),
  });
});
describe("GET /exportItems", () => {
  let createdExportItems: ExportItem[] = [];

  beforeAll(async () => {
    await prisma.exportItem.deleteMany({});
    createdExportItems = await prisma.exportItem.createManyAndReturn({
      data: mockExportItems,
    });
  });

  it("should return all exportItems", async () => {
    const res: PaginatedExportItemsResponse =
      await request(app).get("/exportItems");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdExportItems,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdExportItems.length,
      }),
    );
  });

  it("should return paginated exportItems given page and size", async () => {
    const res: PaginatedExportItemsResponse = await request(app).get(
      "/exportItems?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdExportItems[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all exportItems that relate to queried customerName and max price", async () => {
    const queriedName = createdCustomers[0].name;
    const res: PaginatedExportItemsResponse = await request(app).get(
      `/exportItems?customerName=${queriedName}&maxPrice=22`,
    );
    const filtered = createdExportItems.filter((exportItem) => {
      if (exportItem.unitPrice.comparedTo(22) == 1) return false;
      const customerId = createdExports.find(
        (i) => i.id == exportItem.exportId,
      )?.customerId;
      if (!customerId) return false;
      return createdCustomers.find(
        (s) => s.id === customerId && s.name.includes(queriedName),
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
  it("should return all exportItems sorted according to sortBy and order", async () => {
    const res: PaginatedExportItemsResponse = await request(app).get(
      "/exportItems?sortBy=unitPrice&order=desc",
    );
    const sorted = createdExportItems.toSorted((a, b) =>
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

describe("GET /exportItems/:id", () => {
  let createdExportItem: ExportItem;

  beforeAll(async () => {
    await prisma.exportItem.deleteMany({});
    createdExportItem = await prisma.exportItem.create({
      data: mockExportItems[0],
    });
  });

  it("should return exportItem given valid id", async () => {
    const id = createdExportItem.id;
    const res: ExportItemResponse = await request(app).get(
      `/exportItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdExportItem) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/exportItems/badId");

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

  it("should fail if exportItem isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/exportItems/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ExportItem not found");
  });
});

describe("POST /exportItems", () => {
  beforeAll(async () => {
    await prisma.exportItem.deleteMany({});
  });

  it("should create exportItem successfully given variantId and exportId and quantity and unitPrice optionally", async () => {
    const { variantId, exportId, quantity, unitPrice } = mockExportItems[0];
    const res: ExportItemResponse = await request(app)
      .post("/exportItems")
      .send({ variantId, exportId, quantity, unitPrice });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: { variantId, exportId, quantity, unitPrice },
    });
  });

  it("should fail given invalid exportId or variantId or quantity or unitPrice", async () => {
    const res: ErrorResponse = await request(app)
      .post("/exportItems")
      .send({ exportId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["exportId"],
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

describe("PATCH /exportItems/:id", () => {
  let createdExportItem: ExportItem;
  beforeAll(async () => {
    await prisma.exportItem.deleteMany({});
    createdExportItem = await prisma.exportItem.create({
      data: mockExportItems[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdExportItem.id;
    const res: ExportItemResponse = await request(app)
      .patch(`/exportItems/${id}`)
      .send({ unitPrice: mockExportItems[1].unitPrice });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdExportItem,
          unitPrice: mockExportItems[1].unitPrice,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/exportItems/badId")
      .send({ unitPrice: mockExportItems[1].unitPrice });

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
  it("should fail if exportItem isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/exportItems/99999999")
      .send({ unitPrice: mockExportItems[1].unitPrice });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ExportItem not found");
  });
  it("should fail given invalid exportId or variantId or quantity or unitPrice", async () => {
    const res: ErrorResponse = await request(app)
      .patch(`/exportItems/${createdExportItem.id}`)
      .send({ exportId: -1, variantId: -1, quantity: -1, unitPrice: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["exportId"],
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

describe("DELETE /exportItems/:id", () => {
  let createdExportItem: ExportItem;

  beforeAll(async () => {
    await prisma.exportItem.deleteMany({});
    createdExportItem = await prisma.exportItem.create({
      data: mockExportItems[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdExportItem.id;
    const res: ExportItemResponse = await request(app).delete(
      `/exportItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdExportItem) });

    const res2: ErrorResponse = await request(app).get(`/exportItems/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ExportItem not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/exportItems/badId");

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

  it("should fail if exportItem isn't found", async () => {
    const res: ErrorResponse = await request(app).delete(
      "/exportItems/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ExportItem not found");
  });
});

afterAll(async () => {
  await prisma.exportItem.deleteMany({});
  await prisma.export.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
