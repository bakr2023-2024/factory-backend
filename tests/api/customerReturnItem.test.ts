import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { CustomerReturnItem } from "../../src/db/generated/prisma/client";
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

type CustomerReturnItemResponse = DataResponse<CustomerReturnItem>;
type PaginatedCustomerReturnItemsResponse = PaginationResponse<
  CustomerReturnItem[]
>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /customerReturnItems", () => {
  it("should return all customer return items", async () => {
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      "/customerReturnItems",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.customerReturnItems,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.customerReturnItems.length / 20),
        totalCount: seed.customerReturnItems.length,
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
        data: seed.customerReturnItems.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.customerReturnItems.length / 2),
        totalCount: seed.customerReturnItems.length,
      }),
    );
  });

  it("should return all customer return items given customerReturnId", async () => {
    const customerReturnId = seed.customerReturns[0].id;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerReturnId=${customerReturnId}`,
    );
    const filtered = seed.customerReturnItems.filter(
      (i) => i.customerReturnId === customerReturnId,
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

  it("should return all customer return items given customerId", async () => {
    const customerId = seed.customers[1].id;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerId=${customerId}`,
    );
    const customerReturnIds = seed.customerReturns
      .filter((r) => r.customerId === customerId)
      .map((r) => r.id);
    const filtered = seed.customerReturnItems.filter((i) =>
      customerReturnIds.includes(i.customerReturnId),
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

  it("should return all customer return items given exportItemId", async () => {
    const exportItemId = seed.exportItems[0].id;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?exportItemId=${exportItemId}`,
    );
    const filtered = seed.customerReturnItems.filter(
      (i) => i.exportItemId === exportItemId,
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

  it("should return all customer return items given customerName", async () => {
    const customerName = seed.customers[0].name;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerName=${encodeURIComponent(customerName)}`,
    );
    const customerIds = seed.customers
      .filter((c) => c.name === customerName)
      .map((c) => c.id);
    const customerReturnIds = seed.customerReturns
      .filter((r) => customerIds.includes(r.customerId))
      .map((r) => r.id);
    const filtered = seed.customerReturnItems.filter((i) =>
      customerReturnIds.includes(i.customerReturnId),
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

  it("should return all customer return items given customerNumber", async () => {
    const customerNumber = seed.customers[1].number!;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?customerNumber=${customerNumber}`,
    );
    const customerIds = seed.customers
      .filter((c) => c.number === customerNumber)
      .map((c) => c.id);
    const customerReturnIds = seed.customerReturns
      .filter((r) => customerIds.includes(r.customerId))
      .map((r) => r.id);
    const filtered = seed.customerReturnItems.filter((i) =>
      customerReturnIds.includes(i.customerReturnId),
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

  it("should return all customer return items given itemName", async () => {
    const item = seed.items[0];
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?itemName=${encodeURIComponent(item.name)}`,
    );
    const variantIds = seed.variants
      .filter((v) => v.itemId === item.id)
      .map((v) => v.id);
    const exportItemIds = seed.exportItems
      .filter((e) => variantIds.includes(e.variantId))
      .map((e) => e.id);
    const filtered = seed.customerReturnItems.filter((i) =>
      exportItemIds.includes(i.exportItemId),
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

  it("should return all customer return items given unitWeight", async () => {
    const unitWeight = seed.variants[0].unitWeight.toNumber();
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?unitWeight=${unitWeight}`,
    );
    const variantIds = seed.variants
      .filter((v) => v.unitWeight.toNumber() === unitWeight)
      .map((v) => v.id);
    const exportItemIds = seed.exportItems
      .filter((e) => variantIds.includes(e.variantId))
      .map((e) => e.id);
    const filtered = seed.customerReturnItems.filter((i) =>
      exportItemIds.includes(i.exportItemId),
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

  it("should return all customer return items given quantity", async () => {
    const quantity = seed.customerReturnItems[1].quantity;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?quantity=${quantity}`,
    );
    const filtered = seed.customerReturnItems.filter(
      (i) => i.quantity === quantity,
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

  // seeded unit prices are 1.5, 3 and 4.5
  it("should return all customer return items given minPrice", async () => {
    const minPrice = 3;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?minPrice=${minPrice}`,
    );
    const filtered = seed.customerReturnItems.filter(
      (i) => i.unitPrice.toNumber() >= minPrice,
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

  it("should return all customer return items given maxPrice", async () => {
    const maxPrice = 3;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?maxPrice=${maxPrice}`,
    );
    const filtered = seed.customerReturnItems.filter(
      (i) => i.unitPrice.toNumber() <= maxPrice,
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

  it("should return all customer return items given minPrice and maxPrice", async () => {
    const minPrice = 2;
    const maxPrice = 4;
    const res: PaginatedCustomerReturnItemsResponse = await auth().get(
      `/customerReturnItems?minPrice=${minPrice}&maxPrice=${maxPrice}`,
    );
    const filtered = seed.customerReturnItems.filter(
      (i) =>
        i.unitPrice.toNumber() >= minPrice &&
        i.unitPrice.toNumber() <= maxPrice,
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

describe("GET /customerReturnItems/:id", () => {
  it("should return customer return item given valid id", async () => {
    const item = seed.customerReturnItems[0];
    const res: CustomerReturnItemResponse = await auth().get(
      `/customerReturnItems/${item.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(item) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/customerReturnItems/badId");

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

  it("should fail if customer return item isn't found", async () => {
    const res: ErrorResponse = await auth().get(
      "/customerReturnItems/999999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturnItem not found");
  });
});

describe("POST /customerReturnItems", () => {
  it("should create customer return item successfully given valid data", async () => {
    // exportItems[3] is not returned by any seeded customer return item
    const payload = {
      customerReturnId: seed.customerReturns[0].id,
      exportItemId: seed.exportItems[3].id,
      quantity: 2,
      unitPrice: 12,
      notes: "New returned item",
    };
    const res: CustomerReturnItemResponse = await auth()
      .post("/customerReturnItems")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
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
        message: "value can only be a positive integer",
        path: ["customerReturnId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["exportItemId"],
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

  it("should fail if customerReturn/exportItem aren't found", async () => {
    const res: ErrorResponse = await auth().post("/customerReturnItems").send({
      customerReturnId: 99999999,
      exportItemId: 99999999,
      quantity: 2,
      unitPrice: 12,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customerReturn/exportItem exists with that ID",
    );
  });
});

describe("PATCH /customerReturnItems/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const item = seed.customerReturnItems[0];
    const res: CustomerReturnItemResponse = await auth()
      .patch(`/customerReturnItems/${item.id}`)
      .send({ quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...item, quantity: 2 }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customerReturnItems/badId")
      .send({ quantity: 2 });

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

  it("should fail if customer return item isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customerReturnItems/99999999")
      .send({ quantity: 2 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturnItem not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturnItems/${seed.customerReturnItems[0].id}`)
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

  it("should fail if customerReturn/exportItem aren't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturnItems/${seed.customerReturnItems[0].id}`)
      .send({ customerReturnId: 99999999, exportItemId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customerReturn/exportItem exists with that ID",
    );
  });
});

describe("DELETE /customerReturnItems/:id", () => {
  it("should delete successfully given valid id", async () => {
    // customerReturnItems[1]: the PATCH tests above only touched customerReturnItems[0]
    const item = seed.customerReturnItems[1];
    const res: CustomerReturnItemResponse = await auth().delete(
      `/customerReturnItems/${item.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(item) });

    const res2: ErrorResponse = await auth().get(
      `/customerReturnItems/${item.id}`,
    );

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
        message: "value can only be a positive integer",
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
  await cleanDatabase();
  await prisma.$disconnect();
});
