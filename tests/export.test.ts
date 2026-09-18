import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Export, Customer } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type ExportResponse = DataResponse<Export>;
type PaginatedExportsResponse = PaginationResponse<Export[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockCustomers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
];
let mockExports: { customerId: number; createdAt: Date }[] = [];
let createdCustomers: Customer[];
beforeAll(async () => {
  createdCustomers = await prisma.customer.createManyAndReturn({
    data: mockCustomers,
  });
  mockExports.push({
    customerId: createdCustomers[0].id,
    createdAt: new Date("2026-09-12T10:00:00Z"),
  });
  mockExports.push({
    customerId: createdCustomers[0].id,
    createdAt: new Date("2026-09-16T15:00:00Z"),
  });
  mockExports.push({
    customerId: createdCustomers[1].id,
    createdAt: new Date("2026-09-14T20:00:00Z"),
  });
});
describe("GET /exports", () => {
  let createdExports: Export[] = [];

  beforeAll(async () => {
    await prisma.export.deleteMany({});
    createdExports = await prisma.export.createManyAndReturn({
      data: mockExports,
    });
  });

  it("should return all exports", async () => {
    const res: PaginatedExportsResponse = await request(app).get("/exports");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdExports,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdExports.length,
      }),
    );
  });

  it("should return paginated exports given page and size", async () => {
    const res: PaginatedExportsResponse = await request(app).get(
      "/exports?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdExports[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all exports that relate to customerId", async () => {
    const res: PaginatedExportsResponse = await request(app).get(
      `/exports?customerId=${createdCustomers[0].id}`,
    );
    const filtered = createdExports.filter(
      (exporte) => exporte.customerId === createdCustomers[0].id,
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
  it("should return all exports that were created between createdFrom and createdTo", async () => {
    const start = "2026-09-12T00:00:00Z";
    const end = "2026-09-15T00:00:00Z";
    const res: PaginatedExportsResponse = await request(app).get(
      `/exports?createdFrom=${start}&createdTo=${end}`,
    );
    const filtered = createdExports.filter(
      ({ createdAt }) =>
        createdAt.toISOString() >= start && createdAt.toISOString() < end,
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

describe("GET /exports/:id", () => {
  let createdExport: Export;

  beforeAll(async () => {
    await prisma.export.deleteMany({});
    createdExport = await prisma.export.create({ data: mockExports[0] });
  });

  it("should return export given valid id", async () => {
    const id = createdExport.id;
    const res: ExportResponse = await request(app).get(`/exports/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdExport) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/exports/badId");

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

  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/exports/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Export not found");
  });
});

describe("POST /exports", () => {
  beforeAll(async () => {
    await prisma.export.deleteMany({});
  });

  it("should create export successfully given customerId", async () => {
    const res: ExportResponse = await request(app)
      .post("/exports")
      .send({ customerId: mockExports[0].customerId });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: { customerId: mockExports[0].customerId },
    });
  });

  it("should fail given invalid customerId", async () => {
    const res: ErrorResponse = await request(app)
      .post("/exports")
      .send({ customerId: -1 });

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
  it("should fail given non-existent customerId", async () => {
    const res: ErrorResponse = await request(app)
      .post("/exports")
      .send({ customerId: 99999999 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No customer exists with this ID");
  });
});

describe("PATCH /exports/:id", () => {
  let createdExport: Export;
  beforeAll(async () => {
    await prisma.export.deleteMany({});
    createdExport = await prisma.export.create({ data: mockExports[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdExport.id;
    const res: ExportResponse = await request(app)
      .patch(`/exports/${id}`)
      .send({ customerId: mockExports[1].customerId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdExport,
          customerId: mockExports[1].customerId,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/exports/badId")
      .send({ customerId: mockExports[2].customerId });

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
  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/exports/99999999")
      .send({ customerId: mockExports[0].customerId });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Export not found");
  });
  it("should fail given invalid customerId", async () => {
    const res: ErrorResponse = await request(app)
      .patch(`/exports/${createdExport.id}`)
      .send({ customerId: -1 });

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
  it("should fail given non-existent customer", async () => {
    const id = createdExport.id;
    const res: ErrorResponse = await request(app)
      .patch(`/exports/${id}`)
      .send({ customerId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No customer exists with that ID");
  });
});

describe("DELETE /exports/:id", () => {
  let createdExport: Export;

  beforeAll(async () => {
    await prisma.export.deleteMany({});
    createdExport = await prisma.export.create({ data: mockExports[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdExport.id;
    const res: ExportResponse = await request(app).delete(`/exports/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdExport) });

    const res2: ErrorResponse = await request(app).get(`/exports/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Export not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/exports/badId");

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

  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await request(app).delete("/exports/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Export not found");
  });
});

afterAll(async () => {
  await prisma.export.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.$disconnect();
});
