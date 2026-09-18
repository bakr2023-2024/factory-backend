import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Import, Supplier } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";

type ImportResponse = DataResponse<Import>;
type PaginatedImportsResponse = PaginationResponse<Import[]>;

const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

const mockSuppliers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
];
let mockImports: { supplierId: number; createdAt: Date }[] = [];
let createdSuppliers: Supplier[];
beforeAll(async () => {
  createdSuppliers = await prisma.supplier.createManyAndReturn({
    data: mockSuppliers,
  });
  mockImports.push({
    supplierId: createdSuppliers[0].id,
    createdAt: new Date("2026-09-12T10:00:00Z"),
  });
  mockImports.push({
    supplierId: createdSuppliers[0].id,
    createdAt: new Date("2026-09-16T15:00:00Z"),
  });
  mockImports.push({
    supplierId: createdSuppliers[1].id,
    createdAt: new Date("2026-09-14T20:00:00Z"),
  });
});
describe("GET /imports", () => {
  let createdImports: Import[] = [];

  beforeAll(async () => {
    await prisma.import.deleteMany({});
    createdImports = await prisma.import.createManyAndReturn({
      data: mockImports,
    });
  });

  it("should return all imports", async () => {
    const res: PaginatedImportsResponse = await request(app).get("/imports");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdImports,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdImports.length,
      }),
    );
  });

  it("should return paginated imports given page and size", async () => {
    const res: PaginatedImportsResponse = await request(app).get(
      "/imports?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdImports[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all imports that relate to supplierId", async () => {
    const res: PaginatedImportsResponse = await request(app).get(
      `/imports?supplierId=${createdSuppliers[0].id}`,
    );
    const filtered = createdImports.filter(
      (importe) => importe.supplierId === createdSuppliers[0].id,
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
  it("should return all imports that were created between createdFrom and createdTo", async () => {
    const start = "2026-09-12T00:00:00Z";
    const end = "2026-09-15T00:00:00Z";
    const res: PaginatedImportsResponse = await request(app).get(
      `/imports?createdFrom=${start}&createdTo=${end}`,
    );
    const filtered = createdImports.filter(
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

describe("GET /imports/:id", () => {
  let createdImport: Import;

  beforeAll(async () => {
    await prisma.import.deleteMany({});
    createdImport = await prisma.import.create({ data: mockImports[0] });
  });

  it("should return import given valid id", async () => {
    const id = createdImport.id;
    const res: ImportResponse = await request(app).get(`/imports/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdImport) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).get("/imports/badId");

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

  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await request(app).get("/imports/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Import not found");
  });
});

describe("POST /imports", () => {
  beforeAll(async () => {
    await prisma.import.deleteMany({});
  });

  it("should create import successfully given supplierId", async () => {
    const res: ImportResponse = await request(app)
      .post("/imports")
      .send({ supplierId: mockImports[0].supplierId });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: { supplierId: mockImports[0].supplierId },
    });
  });

  it("should fail given invalid supplierId", async () => {
    const res: ErrorResponse = await request(app)
      .post("/imports")
      .send({ supplierId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["supplierId"],
      },
    ]);
  });
  it("should fail given non-existent supplierId", async () => {
    const res: ErrorResponse = await request(app)
      .post("/imports")
      .send({ supplierId: 99999999 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No supplier exists with this ID");
  });
});

describe("PATCH /imports/:id", () => {
  let createdImport: Import;
  beforeAll(async () => {
    await prisma.import.deleteMany({});
    createdImport = await prisma.import.create({ data: mockImports[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdImport.id;
    const res: ImportResponse = await request(app)
      .patch(`/imports/${id}`)
      .send({ supplierId: mockImports[1].supplierId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdImport,
          supplierId: mockImports[1].supplierId,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/imports/badId")
      .send({ supplierId: mockImports[2].supplierId });

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
  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await request(app)
      .patch("/imports/99999999")
      .send({ supplierId: mockImports[0].supplierId });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Import not found");
  });
  it("should fail given invalid supplierId", async () => {
    const res: ErrorResponse = await request(app)
      .patch(`/imports/${createdImport.id}`)
      .send({ supplierId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["supplierId"],
      },
    ]);
  });
  it("should fail given non-existent supplier", async () => {
    const id = createdImport.id;
    const res: ErrorResponse = await request(app)
      .patch(`/imports/${id}`)
      .send({ supplierId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No supplier exists with that ID");
  });
});

describe("DELETE /imports/:id", () => {
  let createdImport: Import;

  beforeAll(async () => {
    await prisma.import.deleteMany({});
    createdImport = await prisma.import.create({ data: mockImports[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdImport.id;
    const res: ImportResponse = await request(app).delete(`/imports/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdImport) });

    const res2: ErrorResponse = await request(app).get(`/imports/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Import not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await request(app).delete("/imports/badId");

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

  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await request(app).delete("/imports/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Import not found");
  });
});

afterAll(async () => {
  await prisma.import.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.$disconnect();
});
