import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Supplier } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type SupplierResponse = DataResponse<Supplier>;
type PaginatedSuppliersResponse = PaginationResponse<Supplier[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockSuppliers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
];
describe("GET /suppliers", () => {
  let createdSuppliers: Supplier[] = [];

  beforeAll(async () => {
    await prisma.supplier.deleteMany({});
    createdSuppliers = await prisma.supplier.createManyAndReturn({
      data: mockSuppliers,
    });
  });

  it("should return all suppliers", async () => {
    const res: PaginatedSuppliersResponse =
      await request(app).get("/suppliers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdSuppliers,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdSuppliers.length,
      }),
    );
  });

  it("should return paginated suppliers given page and size", async () => {
    const res: PaginatedSuppliersResponse = await request(app).get(
      "/suppliers?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdSuppliers[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all suppliers that relate to queried name or number", async () => {
    const res: PaginatedSuppliersResponse = await request(app).get(
      "/suppliers?name=brock%20lesner",
    );
    const filtered = createdSuppliers.filter(
      (supplier) => supplier.name === createdSuppliers[2].name,
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
    const res2: PaginatedSuppliersResponse = await request(app).get(
      `/suppliers?number=09997000`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(expectedRes);
  });
});

describe("GET /suppliers/:id", () => {
  let createdSupplier: Supplier;

  beforeAll(async () => {
    await prisma.supplier.deleteMany({});
    createdSupplier = await prisma.supplier.create({ data: mockSuppliers[0] });
  });

  it("should return supplier given valid id", async () => {
    const id = createdSupplier.id;
    const res: SupplierResponse = await request(app).get(`/suppliers/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdSupplier) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/suppliers/badId");

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/suppliers/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Supplier not found");
  });
});

describe("POST /suppliers", () => {
  beforeAll(async () => {
    await prisma.supplier.deleteMany({});
  });

  it("should create supplier successfully given name and number", async () => {
    const res: SupplierResponse = await request(app)
      .post("/suppliers")
      .send(mockSuppliers[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: mockSuppliers[0] });
  });

  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await request(app)
      .post("/suppliers")
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

describe("PATCH /suppliers/:id", () => {
  let createdSupplier: Supplier;
  beforeAll(async () => {
    await prisma.supplier.deleteMany({});
    createdSupplier = await prisma.supplier.create({ data: mockSuppliers[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdSupplier.id;
    const res: SupplierResponse = await request(app)
      .patch(`/suppliers/${id}`)
      .send({ name: mockSuppliers[1].name });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdSupplier,
          name: mockSuppliers[1].name,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/suppliers/badId")
      .send({ name: mockSuppliers[1].name });

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
  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/suppliers/99999999")
      .send({ name: mockSuppliers[1].name });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Supplier not found");
  });
  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await request(app)
      .post("/suppliers")
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

describe("DELETE /suppliers/:id", () => {
  let createdSupplier: Supplier;

  beforeAll(async () => {
    await prisma.supplier.deleteMany({});
    createdSupplier = await prisma.supplier.create({ data: mockSuppliers[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdSupplier.id;
    const res: SupplierResponse = await request(app).delete(`/suppliers/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdSupplier) });

    const res2: ErrorResponse = await request(app).get(`/suppliers/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Supplier not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/suppliers/badId");

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await request(app).delete("/suppliers/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Supplier not found");
  });
});

afterAll(async () => {
  await prisma.supplier.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.$disconnect();
});
