import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { CustomerReturn } from "../../src/db/generated/prisma/client";
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

type CustomerReturnResponse = DataResponse<CustomerReturn>;
type PaginatedCustomerReturnsResponse = PaginationResponse<CustomerReturn[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /customerReturns", () => {
  it("should return all customer returns", async () => {
    const res: PaginatedCustomerReturnsResponse =
      await auth().get("/customerReturns");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.customerReturns,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.customerReturns.length / 20),
        totalCount: seed.customerReturns.length,
      }),
    );
  });

  it("should return paginated customer returns given page and size", async () => {
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      "/customerReturns?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.customerReturns.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.customerReturns.length / 2),
        totalCount: seed.customerReturns.length,
      }),
    );
  });

  it("should return all customer returns given customerId", async () => {
    const customerId = seed.customers[1].id;
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?customerId=${customerId}`,
    );
    const filtered = seed.customerReturns.filter(
      (r) => r.customerId === customerId,
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

  it("should return all customer returns given customerName", async () => {
    const customerName = seed.customers[0].name;
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?customerName=${encodeURIComponent(customerName)}`,
    );
    const customerIds = seed.customers
      .filter((c) => c.name === customerName)
      .map((c) => c.id);
    const filtered = seed.customerReturns.filter((r) =>
      customerIds.includes(r.customerId),
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

  it("should return all customer returns given customerNumber", async () => {
    const customerNumber = seed.customers[1].number!;
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?customerNumber=${customerNumber}`,
    );
    const customerIds = seed.customers
      .filter((c) => c.number === customerNumber)
      .map((c) => c.id);
    const filtered = seed.customerReturns.filter((r) =>
      customerIds.includes(r.customerId),
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
  it("should return all customer returns given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?productionDayId=${productionDayId}`,
    );
    const filtered = seed.customerReturns.filter(
      (c) => c.productionDayId === productionDayId,
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
  it("should return all customer returns given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.customerReturns.filter((c) =>
      dayIds.includes(c.productionDayId),
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
  it("should return all customer returns given occurredFrom", async () => {
    const occurredFrom = new Date(
      seed.customerReturns[0].occurredAt.getTime() + 3600000,
    );
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}`,
    );
    const filtered = seed.customerReturns.filter(
      (r) => r.occurredAt >= occurredFrom,
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

  it("should return all customer returns given occurredTo", async () => {
    const occurredTo = new Date(
      seed.customerReturns[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.customerReturns.filter(
      (r) => r.occurredAt <= occurredTo,
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

  it("should return all customer returns given occurredFrom and occurredTo", async () => {
    const occurredFrom = new Date(
      seed.customerReturns[0].occurredAt.getTime() + 3600000,
    );
    const occurredTo = new Date(
      seed.customerReturns[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.customerReturns.filter(
      (r) => r.occurredAt >= occurredFrom && r.occurredAt <= occurredTo,
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

  it("should return all customer returns sorted according to sortBy and order", async () => {
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      "/customerReturns?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.customerReturns.toSorted(
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

describe("GET /customerReturns/:id", () => {
  it("should return customer return given valid id", async () => {
    const customerReturn = seed.customerReturns[0];
    const res: CustomerReturnResponse = await auth().get(
      `/customerReturns/${customerReturn.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(customerReturn) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/customerReturns/badId");

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

  it("should fail if customer return isn't found", async () => {
    const res: ErrorResponse = await auth().get("/customerReturns/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturn not found");
  });
});

describe("POST /customerReturns", () => {
  it("should create customer return successfully given valid data", async () => {
    const payload = {
      customerId: seed.customers[0].id,
      productionDayId: seed.productionDays[2].id,
      occurredAt: "2026-10-10T09:00:00.000Z",
      notes: "New return",
    };
    const res: CustomerReturnResponse = await auth()
      .post("/customerReturns")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/customerReturns")
      .send({ customerId: -1, productionDayId: -1, occurredAt: "badDate" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["customerId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
    ]);
  });

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth().post("/customerReturns").send({
      customerId: 99999999,
      productionDayId: seed.productionDays[2].id,
      occurredAt: "2026-10-10T09:00:00.000Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/customerReturns").send({
      productionDayId: 99999999,
      customerId: seed.customers[2].id,
      occurredAt: "2026-10-10T09:00:00.000Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with that ID",
    );
  });
});

describe("PATCH /customerReturns/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const customerReturn = seed.customerReturns[0];
    const res: CustomerReturnResponse = await auth()
      .patch(`/customerReturns/${customerReturn.id}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...customerReturn, notes: "Updated notes" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customerReturns/badId")
      .send({ notes: "Updated notes" });

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

  it("should fail if customer return isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customerReturns/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturn not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturns/${seed.customerReturns[0].id}`)
      .send({ customerId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["customerId"],
      },
    ]);
  });

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturns/${seed.customerReturns[0].id}`)
      .send({ customerId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturns/${seed.customerReturns[0].id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with that ID",
    );
  });
});

describe("DELETE /customerReturns/:id", () => {
  it("should delete successfully given valid id", async () => {
    const customerReturn = seed.customerReturns[3];
    const res: CustomerReturnResponse = await auth().delete(
      `/customerReturns/${customerReturn.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(customerReturn) });

    const res2: ErrorResponse = await auth().get(
      `/customerReturns/${customerReturn.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("CustomerReturn not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/customerReturns/badId");

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

  it("should fail if customer return isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/customerReturns/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturn not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
