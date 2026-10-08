import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Customer,
  CustomerReturn,
} from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, auth, login } from "./helpers/auth";
import prisma from "../src/db/prisma";

type CustomerReturnResponse = DataResponse<CustomerReturn>;
type PaginatedCustomerReturnsResponse =
  PaginationResponse<CustomerReturn[]>;

const mockCustomers = [
  {
    name: "Customer One",
    number: "01000000001",
    notes: "First customer",
  },
  {
    name: "Customer Two",
    number: "01000000002",
    notes: "Second customer",
  },
  {
    name: "Customer Three",
    number: "01000000003",
  },
];

let createdCustomers: Customer[];

const mockCustomerReturns: {
  customerId: number;
  occurredAt: Date;
  notes?: string;
}[] = [];

beforeAll(async () => {
  await login();

  await prisma.customerReturnItem.deleteMany({});
  await prisma.customerReturn.deleteMany({});
  await prisma.exportItem.deleteMany({});
  await prisma.export.deleteMany({});
  await prisma.customer.deleteMany({});

  createdCustomers = await prisma.customer.createManyAndReturn({
    data: mockCustomers,
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
      customerId: createdCustomers[2].id,
      occurredAt: new Date("2026-09-27T09:00:00Z"),
    },
  );
});

describe("GET /customerReturns", () => {
  let createdCustomerReturns: CustomerReturn[] = [];

  beforeAll(async () => {
    createdCustomerReturns =
      await prisma.customerReturn.createManyAndReturn({
        data: mockCustomerReturns,
      });
  });

  it("should return all customer returns", async () => {
    const res: PaginatedCustomerReturnsResponse =
      await auth().get("/customerReturns");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdCustomerReturns,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdCustomerReturns.length,
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
        data: [createdCustomerReturns[2], createdCustomerReturns[3]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 4,
      }),
    );
  });

  it("should return all customer returns given customerId", async () => {
    const customerId = createdCustomers[0].id;

    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?customerId=${customerId}`,
    );

    const filtered = createdCustomerReturns.filter(
      (customerReturn) => customerReturn.customerId === customerId,
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

  it("should return all customer returns given customerName", async () => {
    const customerName = "Customer One";

    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?customerName=${encodeURIComponent(customerName)}`,
    );

    const customerIds = createdCustomers
      .filter((customer) => customer.name === customerName)
      .map((customer) => customer.id);

    const filtered = createdCustomerReturns.filter((customerReturn) =>
      customerIds.includes(customerReturn.customerId),
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

  it("should return all customer returns given customerNumber", async () => {
    const customerNumber = "01000000002";

    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?customerNumber=${customerNumber}`,
    );

    const customerIds = createdCustomers
      .filter((customer) => customer.number === customerNumber)
      .map((customer) => customer.id);

    const filtered = createdCustomerReturns.filter((customerReturn) =>
      customerIds.includes(customerReturn.customerId),
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

  it("should return all customer returns given occurredFrom", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";

    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?occurredFrom=${encodeURIComponent(occurredFrom)}`,
    );

    const filtered = createdCustomerReturns.filter(
      (customerReturn) =>
        customerReturn.occurredAt >= new Date(occurredFrom),
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

  it("should return all customer returns given occurredTo", async () => {
    const occurredTo = "2026-09-25T09:00:00.000Z";

    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = createdCustomerReturns.filter(
      (customerReturn) =>
        customerReturn.occurredAt <= new Date(occurredTo),
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

  it("should return all customer returns given occurredFrom and occurredTo", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";
    const occurredTo = "2026-09-25T09:00:00.000Z";

    const res: PaginatedCustomerReturnsResponse = await auth().get(
      `/customerReturns?occurredFrom=${encodeURIComponent(
        occurredFrom,
      )}&occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = createdCustomerReturns.filter(
      (customerReturn) =>
        customerReturn.occurredAt >= new Date(occurredFrom) &&
        customerReturn.occurredAt <= new Date(occurredTo),
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

  it("should return all customer returns sorted according to sortBy and order", async () => {
    const res: PaginatedCustomerReturnsResponse = await auth().get(
      "/customerReturns?sortBy=occurredAt&order=desc",
    );

    const sorted = createdCustomerReturns.toSorted(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
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

describe("GET /customerReturns/:id", () => {
  let createdCustomerReturn: CustomerReturn;

  beforeAll(async () => {
    await prisma.customerReturn.deleteMany({});

    createdCustomerReturn = await prisma.customerReturn.create({
      data: mockCustomerReturns[0],
    });
  });

  it("should return customer return given valid id", async () => {
    const id = createdCustomerReturn.id;

    const res: CustomerReturnResponse = await auth().get(
      `/customerReturns/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdCustomerReturn),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get(
      "/customerReturns/badId",
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

  it("should fail if customer return isn't found", async () => {
    const res: ErrorResponse = await auth().get(
      "/customerReturns/999999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturn not found");
  });
});

describe("POST /customerReturns", () => {
  beforeAll(async () => {
    await prisma.customerReturn.deleteMany({});
  });

  it("should create customer return successfully given valid data", async () => {
    const res: CustomerReturnResponse = await auth()
      .post("/customerReturns")
      .send(mockCustomerReturns[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({
        data: mockCustomerReturns[0],
      }),
    );
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/customerReturns")
      .send({
        customerId: -1,
        occurredAt: "badDate",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["customerId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
    ]);
  });

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/customerReturns")
      .send({
        ...mockCustomerReturns[0],
        customerId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer exists with that ID",
    );
  });
});

describe("PATCH /customerReturns/:id", () => {
  let createdCustomerReturn: CustomerReturn;

  beforeAll(async () => {
    await prisma.customerReturn.deleteMany({});

    createdCustomerReturn = await prisma.customerReturn.create({
      data: mockCustomerReturns[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdCustomerReturn.id;

    const res: CustomerReturnResponse = await auth()
      .patch(`/customerReturns/${id}`)
      .send({
        notes: "Updated notes",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdCustomerReturn,
          notes: "Updated notes",
        }),
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
        message: "ID can only be a positive integer",
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
      .patch(`/customerReturns/${createdCustomerReturn.id}`)
      .send({
        customerId: -1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["customerId"],
      },
    ]);
  });

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customerReturns/${createdCustomerReturn.id}`)
      .send({
        customerId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer exists with that ID",
    );
  });
});

describe("DELETE /customerReturns/:id", () => {
  let createdCustomerReturn: CustomerReturn;

  beforeAll(async () => {
    await prisma.customerReturn.deleteMany({});

    createdCustomerReturn = await prisma.customerReturn.create({
      data: mockCustomerReturns[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdCustomerReturn.id;

    const res: CustomerReturnResponse = await auth().delete(
      `/customerReturns/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdCustomerReturn),
    });

    const res2: ErrorResponse = await auth().get(
      `/customerReturns/${id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("CustomerReturn not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete(
      "/customerReturns/badId",
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

  it("should fail if customer return isn't found", async () => {
    const res: ErrorResponse = await auth().delete(
      "/customerReturns/99999999",
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("CustomerReturn not found");
  });
});

afterAll(async () => {
  await prisma.customerReturnItem.deleteMany({});
  await prisma.customerReturn.deleteMany({});
  await prisma.exportItem.deleteMany({});
  await prisma.export.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.$disconnect();
});