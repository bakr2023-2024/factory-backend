import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Customer } from "../../src/db/generated/prisma/client";
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

type CustomerResponse = DataResponse<Customer>;
type PaginatedCustomersResponse = PaginationResponse<Customer[]>;

const newCustomer = { name: "new customer", number: "01234567890" };

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /customers", () => {
  it("should return all customers", async () => {
    const res: PaginatedCustomersResponse = await auth().get("/customers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.customers,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.customers.length / 20),
        totalCount: seed.customers.length,
      }),
    );
  });

  it("should return paginated customers given page and size", async () => {
    const res: PaginatedCustomersResponse = await auth().get(
      "/customers?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.customers.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.customers.length / 2),
        totalCount: seed.customers.length,
      }),
    );
  });

  it("should return all customers that relate to queried name or number", async () => {
    const customer = seed.customers[2];
    const res: PaginatedCustomersResponse = await auth().get(
      `/customers?name=${encodeURIComponent(customer.name)}`,
    );
    const filtered = seed.customers.filter((c) => c.name === customer.name);
    const expectedRes = json({
      data: filtered,
      page: 1,
      size: 20,
      totalPages: Math.ceil(filtered.length / 20),
      totalCount: filtered.length,
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedRes);

    const res2: PaginatedCustomersResponse = await auth().get(
      `/customers?number=${customer.number}`,
    );

    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(expectedRes);
  });

  it("should return all customers sorted according to sortBy and order", async () => {
    const res: PaginatedCustomersResponse = await auth().get(
      "/customers?sortBy=name&order=desc",
    );
    const sorted = seed.customers.toSorted((a, b) =>
      b.name.localeCompare(a.name),
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

describe("GET /customers/:id", () => {
  it("should return customer given valid id", async () => {
    const customer = seed.customers[0];
    const res: CustomerResponse = await auth().get(`/customers/${customer.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(customer) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/customers/badId");

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

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth().get("/customers/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Customer not found");
  });
});

describe("POST /customers", () => {
  it("should create customer successfully given name and number", async () => {
    const res: CustomerResponse = await auth()
      .post("/customers")
      .send(newCustomer);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: newCustomer });
  });

  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await auth()
      .post("/customers")
      .send({ name: "sh", number: "07" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "Name is too short",
        path: ["name"],
      },
      {
        key: "body",
        message: "Number is too short",
        path: ["number"],
      },
    ]);
  });
});

describe("PATCH /customers/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const customer = seed.customers[0];
    const res: CustomerResponse = await auth()
      .patch(`/customers/${customer.id}`)
      .send({ name: "updated name" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...customer, name: "updated name" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customers/badId")
      .send({ name: "updated name" });

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

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/customers/99999999")
      .send({ name: "updated name" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Customer not found");
  });

  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/customers/${seed.customers[0].id}`)
      .send({ name: "sh", number: "07" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "Name is too short",
        path: ["name"],
      },
      {
        key: "body",
        message: "Number is too short",
        path: ["number"],
      },
    ]);
  });
});

describe("DELETE /customers/:id", () => {
  // every seeded customer has exports/returns, so delete one with no children
  let createdCustomer: Customer;

  beforeAll(async () => {
    createdCustomer = await prisma.customer.create({ data: newCustomer });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdCustomer.id;
    const res: CustomerResponse = await auth().delete(`/customers/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdCustomer) });

    const res2: ErrorResponse = await auth().get(`/customers/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Customer not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/customers/badId");

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

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/customers/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Customer not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
