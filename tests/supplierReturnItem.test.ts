import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Supplier,
  SupplierReturn,
  SupplierReturnItem,
  Import,
  ImportItem,
  Item,
  ItemType,
  Variant,
} from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, auth, login } from "./helpers/auth";
import prisma from "../src/db/prisma";

type SupplierReturnItemResponse = DataResponse<SupplierReturnItem>;
type PaginatedSupplierReturnItemsResponse = PaginationResponse<
  SupplierReturnItem[]
>;

const mockSuppliers = [
  {
    name: "Supplier One",
    number: "01000000001",
  },
  {
    name: "Supplier Two",
    number: "01000000002",
  },
];

let createdSuppliers: Supplier[];

const mockItems = [
  {
    name: "Fruit Tofu",
    type: ItemType.PRODUCT,
  },
  {
    name: "Coffee Tofu",
    type: ItemType.PRODUCT,
  },
  {
    name: "Honey Barrel",
    type: ItemType.MATERIAL,
  },
];

let createdItems: Item[];

const mockVariants: {
  itemId: number;
  unitWeight: number;
}[] = [];

let createdVariants: Variant[];

const mockImports: {
  supplierId: number;
  occurredAt: Date;
  notes?: string;
}[] = [];

let createdImports: Import[];

const mockImportItems: {
  importId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}[] = [];

let createdImportItems: ImportItem[];

const mockSupplierReturns: {
  supplierId: number;
  occurredAt: Date;
  notes?: string;
}[] = [];

let createdSupplierReturns: SupplierReturn[];

const mockSupplierReturnItems: {
  supplierReturnId: number;
  importItemId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}[] = [];

beforeAll(async () => {
  await login();

  await prisma.supplierReturnItem.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.importItem.deleteMany({});
  await prisma.import.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});

  createdSuppliers = await prisma.supplier.createManyAndReturn({
    data: mockSuppliers,
  });

  createdItems = await prisma.item.createManyAndReturn({
    data: mockItems,
  });

  mockVariants.push(
    {
      itemId: createdItems[0].id,
      unitWeight: 5,
    },
    {
      itemId: createdItems[0].id,
      unitWeight: 7,
    },
    {
      itemId: createdItems[1].id,
      unitWeight: 3,
    },
    {
      itemId: createdItems[2].id,
      unitWeight: 10,
    },
  );

  createdVariants = await prisma.variant.createManyAndReturn({
    data: mockVariants,
  });

  mockImports.push(
    {
      supplierId: createdSuppliers[0].id,
      occurredAt: new Date("2026-09-20T09:00:00Z"),
      notes: "First import",
    },
    {
      supplierId: createdSuppliers[1].id,
      occurredAt: new Date("2026-09-21T09:00:00Z"),
      notes: "Second import",
    },
  );

  createdImports = await prisma.import.createManyAndReturn({
    data: mockImports,
  });

  mockImportItems.push(
    {
      importId: createdImports[0].id,
      variantId: createdVariants[0].id,
      quantity: 50,
      unitPrice: 10,
      notes: "First import item",
    },
    {
      importId: createdImports[0].id,
      variantId: createdVariants[1].id,
      quantity: 30,
      unitPrice: 15,
      notes: "Second import item",
    },
    {
      importId: createdImports[1].id,
      variantId: createdVariants[2].id,
      quantity: 40,
      unitPrice: 20,
    },
    {
      importId: createdImports[1].id,
      variantId: createdVariants[3].id,
      quantity: 25,
      unitPrice: 25,
    },
  );

  createdImportItems = await prisma.importItem.createManyAndReturn({
    data: mockImportItems,
  });

  mockSupplierReturns.push(
    {
      supplierId: createdSuppliers[0].id,
      occurredAt: new Date("2026-09-24T09:00:00Z"),
      notes: "First return",
    },
    {
      supplierId: createdSuppliers[0].id,
      occurredAt: new Date("2026-09-24T10:00:00Z"),
      notes: "Second return",
    },
    {
      supplierId: createdSuppliers[1].id,
      occurredAt: new Date("2026-09-25T09:00:00Z"),
      notes: "Third return",
    },
    {
      supplierId: createdSuppliers[1].id,
      occurredAt: new Date("2026-09-27T09:00:00Z"),
    },
  );

  createdSupplierReturns = await prisma.supplierReturn.createManyAndReturn({
    data: mockSupplierReturns,
  });

  mockSupplierReturnItems.push(
    {
      supplierReturnId: createdSupplierReturns[0].id,
      importItemId: createdImportItems[0].id,
      quantity: 10,
      unitPrice: 10,
      notes: "First returned item",
    },
    {
      supplierReturnId: createdSupplierReturns[0].id,
      importItemId: createdImportItems[1].id,
      quantity: 5,
      unitPrice: 15,
      notes: "Second returned item",
    },
    {
      supplierReturnId: createdSupplierReturns[1].id,
      importItemId: createdImportItems[2].id,
      quantity: 20,
      unitPrice: 20,
    },
    {
      supplierReturnId: createdSupplierReturns[2].id,
      importItemId: createdImportItems[3].id,
      quantity: 8,
      unitPrice: 25,
    },
  );
});

describe("GET /supplierReturnItems", () => {
  let createdSupplierReturnItems: SupplierReturnItem[] = [];

  beforeAll(async () => {
    createdSupplierReturnItems =
      await prisma.supplierReturnItem.createManyAndReturn({
        data: mockSupplierReturnItems,
      });
  });

  it("should return all supplier return items", async () => {
    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      "/supplierReturnItems",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdSupplierReturnItems,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdSupplierReturnItems.length,
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
        data: [createdSupplierReturnItems[2], createdSupplierReturnItems[3]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 4,
      }),
    );
  });

  it("should return all supplier return items given supplierReturnId", async () => {
    const supplierReturnId = createdSupplierReturns[0].id;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierReturnId=${supplierReturnId}`,
    );

    const filtered = createdSupplierReturnItems.filter(
      (item) => item.supplierReturnId === supplierReturnId,
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

  it("should return all supplier return items given supplierId", async () => {
    const supplierId = createdSuppliers[0].id;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierId=${supplierId}`,
    );

    const supplierReturnIds = createdSupplierReturns
      .filter((supplierReturn) => supplierReturn.supplierId === supplierId)
      .map((supplierReturn) => supplierReturn.id);

    const filtered = createdSupplierReturnItems.filter((item) =>
      supplierReturnIds.includes(item.supplierReturnId),
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

  it("should return all supplier return items given importItemId", async () => {
    const importItemId = createdImportItems[0].id;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?importItemId=${importItemId}`,
    );

    const filtered = createdSupplierReturnItems.filter(
      (item) => item.importItemId === importItemId,
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

  it("should return all supplier return items given supplierName", async () => {
    const supplierName = "Supplier One";

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierName=${encodeURIComponent(supplierName)}`,
    );

    const supplierIds = createdSuppliers
      .filter((supplier) => supplier.name === supplierName)
      .map((supplier) => supplier.id);

    const supplierReturnIds = createdSupplierReturns
      .filter((supplierReturn) =>
        supplierIds.includes(supplierReturn.supplierId),
      )
      .map((supplierReturn) => supplierReturn.id);

    const filtered = createdSupplierReturnItems.filter((item) =>
      supplierReturnIds.includes(item.supplierReturnId),
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

  it("should return all supplier return items given supplierNumber", async () => {
    const supplierNumber = "01000000002";

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?supplierNumber=${supplierNumber}`,
    );

    const supplierIds = createdSuppliers
      .filter((supplier) => supplier.number === supplierNumber)
      .map((supplier) => supplier.id);

    const supplierReturnIds = createdSupplierReturns
      .filter((supplierReturn) =>
        supplierIds.includes(supplierReturn.supplierId),
      )
      .map((supplierReturn) => supplierReturn.id);

    const filtered = createdSupplierReturnItems.filter((item) =>
      supplierReturnIds.includes(item.supplierReturnId),
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

  it("should return all supplier return items given itemName", async () => {
    const itemName = "Fruit Tofu";

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?itemName=${encodeURIComponent(itemName)}`,
    );

    const variantIds = createdVariants
      .filter((variant) => {
        const item = createdItems.find((item) => item.id === variant.itemId);

        return item?.name === itemName;
      })
      .map((variant) => variant.id);

    const importItemIds = createdImportItems
      .filter((importItem) => variantIds.includes(importItem.variantId))
      .map((importItem) => importItem.id);

    const filtered = createdSupplierReturnItems.filter((item) =>
      importItemIds.includes(item.importItemId),
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

  it("should return all supplier return items given unitWeight", async () => {
    const unitWeight = 5;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?unitWeight=${unitWeight}`,
    );

    const variantIds = createdVariants
      .filter((variant) => variant.unitWeight.toNumber() === unitWeight)
      .map((variant) => variant.id);

    const importItemIds = createdImportItems
      .filter((importItem) => variantIds.includes(importItem.variantId))
      .map((importItem) => importItem.id);

    const filtered = createdSupplierReturnItems.filter((item) =>
      importItemIds.includes(item.importItemId),
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

  it("should return all supplier return items given quantity", async () => {
    const quantity = 5;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?quantity=${quantity}`,
    );

    const filtered = createdSupplierReturnItems.filter(
      (item) => item.quantity === quantity,
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

  it("should return all supplier return items given minPrice", async () => {
    const minPrice = 20;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?minPrice=${minPrice}`,
    );

    const filtered = createdSupplierReturnItems.filter(
      (item) =>
        item.unitPrice !== null && item.unitPrice.toNumber() >= minPrice,
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

  it("should return all supplier return items given maxPrice", async () => {
    const maxPrice = 15;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?maxPrice=${maxPrice}`,
    );

    const filtered = createdSupplierReturnItems.filter(
      (item) =>
        item.unitPrice !== null && item.unitPrice.toNumber() <= maxPrice,
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

  it("should return all supplier return items given minPrice and maxPrice", async () => {
    const minPrice = 10;
    const maxPrice = 20;

    const res: PaginatedSupplierReturnItemsResponse = await auth().get(
      `/supplierReturnItems?minPrice=${minPrice}&maxPrice=${maxPrice}`,
    );

    const filtered = createdSupplierReturnItems.filter(
      (item) =>
        item.unitPrice !== null &&
        item.unitPrice.toNumber() >= minPrice &&
        item.unitPrice.toNumber() <= maxPrice,
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
});

describe("GET /supplierReturnItems/:id", () => {
  let createdSupplierReturnItem: SupplierReturnItem;

  beforeAll(async () => {
    await prisma.supplierReturnItem.deleteMany({});

    createdSupplierReturnItem = await prisma.supplierReturnItem.create({
      data: mockSupplierReturnItems[0],
    });
  });

  it("should return supplier return item given valid id", async () => {
    const id = createdSupplierReturnItem.id;

    const res: SupplierReturnItemResponse = await auth().get(
      `/supplierReturnItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdSupplierReturnItem),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/supplierReturnItems/badId");

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

  it("should fail if supplier return item isn't found", async () => {
    const res: ErrorResponse = await auth().get(
      "/supplierReturnItems/999999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturnItem not found");
  });
});

describe("POST /supplierReturnItems", () => {
  beforeAll(async () => {
    await prisma.supplierReturnItem.deleteMany({});
  });

  it("should create supplier return item successfully given valid data", async () => {
    const res: SupplierReturnItemResponse = await auth()
      .post("/supplierReturnItems")
      .send(mockSupplierReturnItems[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({
        data: mockSupplierReturnItems[0],
      }),
    );
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
        message: "ID can only be a positive integer",
        path: ["supplierReturnId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["importItemId"],
      },
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
      {
        key: "body",
        message: "unitPrice can only be a positive number",
        path: ["unitPrice"],
      },
    ]);
  });

  it("should fail if supplierReturn/importItem aren't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/supplierReturnItems")
      .send({
        ...mockSupplierReturnItems[0],
        supplierReturnId: 99999999,
        importItemId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplierReturn/importItem exists with that ID",
    );
  });
});

describe("PATCH /supplierReturnItems/:id", () => {
  let createdSupplierReturnItem: SupplierReturnItem;

  beforeAll(async () => {
    await prisma.supplierReturnItem.deleteMany({});

    createdSupplierReturnItem = await prisma.supplierReturnItem.create({
      data: mockSupplierReturnItems[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdSupplierReturnItem.id;

    const res: SupplierReturnItemResponse = await auth()
      .patch(`/supplierReturnItems/${id}`)
      .send({
        quantity: 50,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdSupplierReturnItem,
          quantity: 50,
        }),
        updatedAt: expect.any(String),
      },
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
        message: "ID can only be a positive integer",
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
    const res: ErrorResponse = await auth()
      .patch(`/supplierReturnItems/${createdSupplierReturnItem.id}`)
      .send({
        quantity: -1,
      });

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

  it("should fail if supplierReturn/importItem aren't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/supplierReturnItems/${createdSupplierReturnItem.id}`)
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
  let createdSupplierReturnItem: SupplierReturnItem;

  beforeAll(async () => {
    await prisma.supplierReturnItem.deleteMany({});

    createdSupplierReturnItem = await prisma.supplierReturnItem.create({
      data: mockSupplierReturnItems[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdSupplierReturnItem.id;

    const res: SupplierReturnItemResponse = await auth().delete(
      `/supplierReturnItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdSupplierReturnItem),
    });

    const res2: ErrorResponse = await auth().get(`/supplierReturnItems/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("SupplierReturnItem not found");
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
        message: "ID can only be a positive integer",
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
  await prisma.supplierReturnItem.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.importItem.deleteMany({});
  await prisma.import.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
