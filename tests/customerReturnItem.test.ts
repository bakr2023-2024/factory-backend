import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Customer,
  CustomerReturn,
  CustomerReturnItem,
  Export,
  ExportItem,
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

type CustomerReturnItemResponse = DataResponse<CustomerReturnItem>;
type PaginatedCustomerReturnItemsResponse = PaginationResponse<
  CustomerReturnItem[]
>;

const mockCustomers = [
  {
    name: "Customer One",
    number: "01000000001",
  },
  {
    name: "Customer Two",
    number: "01000000002",
  },
];

let createdCustomers: Customer[];

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

const mockExports: {
  customerId: number;
  occurredAt: Date;
  notes?: string;
}[] = [];

let createdExports: Export[];

const mockExportItems: {
  exportId: number;
  variantId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
}[] = [];

let createdExportItems: ExportItem[];

const mockCustomerReturns: {
  customerId: number;
  occurredAt: Date;
  notes?: string;
}[] = [];

let createdCustomerReturns: CustomerReturn[];

const mockCustomerReturnItems: {
  customerReturnId: number;
  exportItemId: number;
  quantity: number;
  unitPrice?: number;
  notes?: string;
}[] = [];

beforeAll(async () => {
  await login();

  await prisma.customerReturnItem.deleteMany({});
  await prisma.customerReturn.deleteMany({});
  await prisma.exportItem.deleteMany({});
  await prisma.export.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});

  createdCustomers = await prisma.customer.createManyAndReturn({
    data: mockCustomers,
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

  mockExports.push(
    {
      customerId: createdCustomers[0].id,
      occurredAt: new Date("2026-09-20T09:00:00Z"),
      notes: "First export",
    },
    {
      customerId: createdCustomers[1].id,
      occurredAt: new Date("2026-09-21T09:00:00Z"),
      notes: "Second export",
    },
  );

  createdExports = await prisma.export.createManyAndReturn({
    data: mockExports,
  });

  mockExportItems.push(
    {
      exportId: createdExports[0].id,
      variantId: createdVariants[0].id,
      quantity: 50,
      unitPrice: 10,
      notes: "First export item",
    },
    {
      exportId: createdExports[0].id,
      variantId: createdVariants[1].id,
      quantity: 30,
      unitPrice: 15,
      notes: "Second export item",
    },
    {
      exportId: createdExports[1].id,
      variantId: createdVariants[2].id,
      quantity: 40,
      unitPrice: 20,
    },
    {
      exportId: createdExports[1].id,
      variantId: createdVariants[3].id,
      quantity: 25,
      unitPrice: 25,
    },
  );

  createdExportItems = await prisma.exportItem.createManyAndReturn({
    data: mockExportItems,
  });

  mockCustomerReturns.push(
    {
      customerId: createdCustomers[0].id,
      occurredAt: new Date("2026-09-24T09:00:00Z"),
      notes: "First return",
    },
    {
      customerId: createdCustomers[0].id,
      occurredAt: new Date("2026-09-24T10:00:00Z"),
      notes: "Second return",
    },
    {
      customerId: createdCustomers[1].id,
      occurredAt: new Date("2026-09-25T09:00:00Z"),
      notes: "Third return",
    },
    {
      customerId: createdCustomers[1].id,
      occurredAt: new Date("2026-09-27T09:00:00Z"),
    },
  );

  createdCustomerReturns = await prisma.customerReturn.createManyAndReturn({
    data: mockCustomerReturns,
  });

  mockCustomerReturnItems.push(
    {
      customerReturnId: createdCustomerReturns[0].id,
      exportItemId: createdExportItems[0].id,
      quantity: 10,
      unitPrice: 10,
      notes: "First returned item",
    },
    {
      customerReturnId: createdCustomerReturns[0].id,
      exportItemId: createdExportItems[1].id,
      quantity: 5,
      unitPrice: 15,
      notes: "Second returned item",
    },
    {
      customerReturnId: createdCustomerReturns[1].id,
      exportItemId: createdExportItems[2].id,
      quantity: 20,
      unitPrice: 20,
    },
    {
      customerReturnId: createdCustomerReturns[2].id,
      exportItemId: createdExportItems[3].id,
      quantity: 8,
      unitPrice: 25,
    },
  );
});

describe("GET /customerReturnItems", () => {
  let createdCustomerReturnItems: CustomerReturnItem[] = [];

  beforeAll(async () => {
    createdCustomerReturnItems =
      await prisma.customerReturnItem.createManyAndReturn({
        data: mockCustomerReturnItems,
      });
  });

  it("should return all customer return items", async () => {
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      "/customerReturnItems",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdCustomerReturnItems,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdCustomerReturnItems.length,
      }),
    );
  });

  it("should return paginated customer return items given page and size", async () => {
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      "/customerReturnItems?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdCustomerReturnItems[2], createdCustomerReturnItems[3]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 4,
      }),
    );
  });

  it("should return all customer return items given customerReturnId", async () => {
    const customerReturnId = createdCustomerReturns[0].id;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerReturnId=${customerReturnId}`,
    );

    const filtered = createdCustomerReturnItems.filter(
      (item) => item.customerReturnId === customerReturnId,
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

  it("should return all customer return items given customerId", async () => {
    const customerId = createdCustomers[0].id;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerId=${customerId}`,
    );

    const customerReturnIds = createdCustomerReturns
      .filter((customerReturn) => customerReturn.customerId === customerId)
      .map((customerReturn) => customerReturn.id);

    const filtered = createdCustomerReturnItems.filter((item) =>
      customerReturnIds.includes(item.customerReturnId),
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

  it("should return all customer return items given exportItemId", async () => {
    const exportItemId = createdExportItems[0].id;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?exportItemId=${exportItemId}`,
    );

    const filtered = createdCustomerReturnItems.filter(
      (item) => item.exportItemId === exportItemId,
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

  it("should return all customer return items given customerName", async () => {
    const customerName = "Customer One";

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerName=${encodeURIComponent(customerName)}`,
    );

    const customerIds = createdCustomers
      .filter((customer) => customer.name === customerName)
      .map((customer) => customer.id);

    const customerReturnIds = createdCustomerReturns
      .filter((customerReturn) =>
        customerIds.includes(customerReturn.customerId),
      )
      .map((customerReturn) => customerReturn.id);

    const filtered = createdCustomerReturnItems.filter((item) =>
      customerReturnIds.includes(item.customerReturnId),
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

  it("should return all customer return items given customerNumber", async () => {
    const customerNumber = "01000000002";

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerNumber=${customerNumber}`,
    );

    const customerIds = createdCustomers
      .filter((customer) => customer.number === customerNumber)
      .map((customer) => customer.id);

    const customerReturnIds = createdCustomerReturns
      .filter((customerReturn) =>
        customerIds.includes(customerReturn.customerId),
      )
      .map((customerReturn) => customerReturn.id);

    const filtered = createdCustomerReturnItems.filter((item) =>
      customerReturnIds.includes(item.customerReturnId),
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

  it("should return all customer return items given itemName", async () => {
    const itemName = "Fruit Tofu";

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?itemName=${encodeURIComponent(itemName)}`,
    );

    const variantIds = createdVariants
      .filter((variant) => {
        const item = createdItems.find((item) => item.id === variant.itemId);

        return item?.name === itemName;
      })
      .map((variant) => variant.id);

    const exportItemIds = createdExportItems
      .filter((exportItem) => variantIds.includes(exportItem.variantId))
      .map((exportItem) => exportItem.id);

    const filtered = createdCustomerReturnItems.filter((item) =>
      exportItemIds.includes(item.exportItemId),
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

  it("should return all customer return items given unitWeight", async () => {
    const unitWeight = 5;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?unitWeight=${unitWeight}`,
    );

    const variantIds = createdVariants
      .filter((variant) => variant.unitWeight.toNumber() === unitWeight)
      .map((variant) => variant.id);

    const exportItemIds = createdExportItems
      .filter((exportItem) => variantIds.includes(exportItem.variantId))
      .map((exportItem) => exportItem.id);

    const filtered = createdCustomerReturnItems.filter((item) =>
      exportItemIds.includes(item.exportItemId),
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

  it("should return all customer return items given quantity", async () => {
    const quantity = 5;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?quantity=${quantity}`,
    );

    const filtered = createdCustomerReturnItems.filter(
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

  it("should return all customer return items given minPrice", async () => {
    const minPrice = 20;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?minPrice=${minPrice}`,
    );

    const filtered = createdCustomerReturnItems.filter(
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

  it("should return all customer return items given maxPrice", async () => {
    const maxPrice = 15;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?maxPrice=${maxPrice}`,
    );

    const filtered = createdCustomerReturnItems.filter(
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

  it("should return all customer return items given minPrice and maxPrice", async () => {
    const minPrice = 10;
    const maxPrice = 20;

    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?minPrice=${minPrice}&maxPrice=${maxPrice}`,
    );

    const filtered = createdCustomerReturnItems.filter(
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

describe("GET /customerReturnItems/:id", () => {
  let createdCustomerReturnItem: CustomerReturnItem;

  beforeAll(async () => {
    await prisma.customerReturnItem.deleteMany({});

    createdCustomerReturnItem = await prisma.customerReturnItem.create({
      data: mockCustomerReturnItems[0],
    });
  });

  it("should return customer return item given valid id", async () => {
    const id = createdCustomerReturnItem.id;

    const res: CustomerReturnItemResponse = await auth().get(
      `/customerReturnItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdCustomerReturnItem),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/customerReturnItems/badId");

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

  it("should fail if customer return item isn't found", async () => {
    const res: ErrorResponse = await auth().get(
      "/customerReturnItems/999999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturnItem not found");
  });
});

describe("POST /customerReturnItems", () => {
  beforeAll(async () => {
    await prisma.customerReturnItem.deleteMany({});
  });

  it("should create customer return item successfully given valid data", async () => {
    const res: CustomerReturnItemResponse = await auth()
      .post("/customerReturnItems")
      .send(mockCustomerReturnItems[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({
        data: mockCustomerReturnItems[0],
      }),
    );
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/customerReturnItems").send({
      customerReturnId: -1,
      exportItemId: -1,
      quantity: -1,
      unitPrice: -1,
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["customerReturnId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["exportItemId"],
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

  it("should fail if customerReturn/exportItem aren't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/customerReturnItems")
      .send({
        ...mockCustomerReturnItems[0],
        customerReturnId: 99999999,
        exportItemId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customerReturn/exportItem exists with that ID",
    );
  });
});

describe("PATCH /customerReturnItems/:id", () => {
  let createdCustomerReturnItem: CustomerReturnItem;

  beforeAll(async () => {
    await prisma.customerReturnItem.deleteMany({});

    createdCustomerReturnItem = await prisma.customerReturnItem.create({
      data: mockCustomerReturnItems[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdCustomerReturnItem.id;

    const res: CustomerReturnItemResponse = await auth()
      .patch(`/customerReturnItems/${id}`)
      .send({
        quantity: 50,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdCustomerReturnItem,
          quantity: 50,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customerReturnItems/badId")
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

  it("should fail if customer return item isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customerReturnItems/99999999")
      .send({ quantity: 50 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturnItem not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturnItems/${createdCustomerReturnItem.id}`)
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

  it("should fail if customerReturn/exportItem aren't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturnItems/${createdCustomerReturnItem.id}`)
      .send({
        customerReturnId: 99999999,
        exportItemId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customerReturn/exportItem exists with that ID",
    );
  });
});

describe("DELETE /customerReturnItems/:id", () => {
  let createdCustomerReturnItem: CustomerReturnItem;

  beforeAll(async () => {
    await prisma.customerReturnItem.deleteMany({});

    createdCustomerReturnItem = await prisma.customerReturnItem.create({
      data: mockCustomerReturnItems[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdCustomerReturnItem.id;

    const res: CustomerReturnItemResponse = await auth().delete(
      `/customerReturnItems/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdCustomerReturnItem),
    });

    const res2: ErrorResponse = await auth().get(`/customerReturnItems/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("CustomerReturnItem not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete(
      "/customerReturnItems/badId",
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

  it("should fail if customer return item isn't found", async () => {
    const res: ErrorResponse = await auth().delete(
      "/customerReturnItems/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturnItem not found");
  });
});

afterAll(async () => {
  await prisma.customerReturnItem.deleteMany({});
  await prisma.customerReturn.deleteMany({});
  await prisma.exportItem.deleteMany({});
  await prisma.export.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
