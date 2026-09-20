import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Customer } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type CustomerResponse = DataResponse<Customer>;
type PaginatedCustomersResponse = PaginationResponse<Customer[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockCustomers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
];
describe("GET /customers", () => {
  let createdCustomers: Customer[] = [];

  beforeAll(async () => {
    await prisma.customer.deleteMany({});
    createdCustomers = await prisma.customer.createManyAndReturn({
      data: mockCustomers,
    });
  });

  it("should return all customers", async () => {
    const res: PaginatedCustomersResponse =
      await request(app).get("/customers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdCustomers,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdCustomers.length,
      }),
    );
  });

  it("should return paginated customers given page and size", async () => {
    const res: PaginatedCustomersResponse = await request(app).get(
      "/customers?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdCustomers[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all customers that relate to queried name or number", async () => {
    const res: PaginatedCustomersResponse = await request(app).get(
      "/customers?name=brock%20lesner",
    );
    const filtered = createdCustomers.filter(
      (customer) => customer.name === createdCustomers[2].name,
    );
    const expectedRes = json({
      data: filtered,
      page: 1,
      size: 20,
      totalPages: 1,
      totalCount: filtered.length,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedRes);
    const res2: PaginatedCustomersResponse = await request(app).get(
      `/customers?number=09997000`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(expectedRes);
  });
    it("should return all customers sorted according to sortBy and order", async () => {
      const res: PaginatedCustomersResponse = await request(app).get(
        "/customers?sortBy=name&order=desc",
      );
      const sorted = createdCustomers.toSorted((a, b) =>
        b.name.localeCompare(a.name),
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

describe("GET /customers/:id", () => {
  let createdCustomer: Customer;

  beforeAll(async () => {
    await prisma.customer.deleteMany({});
    createdCustomer = await prisma.customer.create({ data: mockCustomers[0] });
  });

  it("should return customer given valid id", async () => {
    const id = createdCustomer.id;
    const res: CustomerResponse = await request(app).get(`/customers/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdCustomer) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/customers/badId");

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

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/customers/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Customer not found");
  });
});

describe("POST /customers", () => {
  beforeAll(async () => {
    await prisma.customer.deleteMany({});
  });

  it("should create customer successfully given name and number", async () => {
    const res: CustomerResponse = await request(app)
      .post("/customers")
      .send(mockCustomers[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: mockCustomers[0] });
  });

  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await request(app)
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
  let createdCustomer: Customer;
  beforeAll(async () => {
    await prisma.customer.deleteMany({});
    createdCustomer = await prisma.customer.create({ data: mockCustomers[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdCustomer.id;
    const res: CustomerResponse = await request(app)
      .patch(`/customers/${id}`)
      .send({ name: mockCustomers[1].name });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdCustomer,
          name: mockCustomers[1].name,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/customers/badId")
      .send({ name: mockCustomers[1].name });

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
  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/customers/99999999")
      .send({ name: mockCustomers[1].name });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Customer not found");
  });
  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await request(app)
      .patch(`/customers/${createdCustomer.id}`)
      .send({ name: "sh", number: "07" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
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
  let createdCustomer: Customer;

  beforeAll(async () => {
    await prisma.customer.deleteMany({});
    createdCustomer = await prisma.customer.create({ data: mockCustomers[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdCustomer.id;
    const res: CustomerResponse = await request(app).delete(`/customers/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdCustomer) });

    const res2: ErrorResponse = await request(app).get(`/customers/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Customer not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/customers/badId");

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

  it("should fail if customer isn't found", async () => {
    const res: ErrorResponse = await request(app).delete("/customers/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Customer not found");
  });
});

afterAll(async () => {
  await prisma.customer.deleteMany({});
  await prisma.$disconnect();
});
