import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Supplier } from "../../src/db/generated/prisma/client";
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

type SupplierResponse = DataResponse<Supplier>;
type PaginatedSuppliersResponse = PaginationResponse<Supplier[]>;
const newSupplier = { name: "new supplier", number: "01234567890" };
let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /suppliers", () => {
  it("should return all suppliers", async () => {
    const res: PaginatedSuppliersResponse = await auth().get("/suppliers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.suppliers,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.suppliers.length / 20),
        totalCount: seed.suppliers.length,
      }),
    );
  });

  it("should return paginated suppliers given page and size", async () => {
    const res: PaginatedSuppliersResponse = await auth().get(
      "/suppliers?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.suppliers.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.suppliers.length / 2),
        totalCount: seed.suppliers.length,
      }),
    );
  });

  it("should return all suppliers that relate to queried name", async () => {
    const supplier = seed.suppliers[2];

    const res: PaginatedSuppliersResponse = await auth().get(
      `/suppliers?name=${encodeURIComponent(supplier.name)}`,
    );

    const filtered = seed.suppliers.filter((s) => s.name === supplier.name);

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

  it("should return all suppliers that relate to queried number", async () => {
    const supplier = seed.suppliers[2];

    const res: PaginatedSuppliersResponse = await auth().get(
      `/suppliers?number=${supplier.number}`,
    );

    const filtered = seed.suppliers.filter((s) => s.number === supplier.number);

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

  it("should return all suppliers sorted according to sortBy and order", async () => {
    const res: PaginatedSuppliersResponse = await auth().get(
      "/suppliers?sortBy=name&order=desc",
    );

    const sorted = seed.suppliers.toSorted((a, b) =>
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

describe("GET /suppliers/:id", () => {
  it("should return supplier given valid id", async () => {
    const supplier = seed.suppliers[0];

    const res: SupplierResponse = await auth().get(`/suppliers/${supplier.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(supplier) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/suppliers/badId");

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth().get("/suppliers/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Supplier not found");
  });
});

describe("POST /suppliers", () => {
  it("should create supplier successfully given name and number", async () => {
    const payload = {
      name: "new supplier",
      number: "01234567890",
    };

    const res: SupplierResponse = await auth().post("/suppliers").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await auth()
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
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const supplier = seed.suppliers[0];

    const res: SupplierResponse = await auth()
      .patch(`/suppliers/${supplier.id}`)
      .send({ name: "updated supplier" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...supplier,
          name: "updated supplier",
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/suppliers/badId")
      .send({ name: "updated supplier" });

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/suppliers/99999999")
      .send({ name: "updated supplier" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Supplier not found");
  });

  it("should fail given invalid name or invalid number", async () => {
    const supplier = seed.suppliers[0];

    const res: ErrorResponse = await auth()
      .patch(`/suppliers/${supplier.id}`)
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

describe("DELETE /suppliers/:id", () => {
  let createdSupplier:Supplier;
  beforeAll(async()=>{
    createdSupplier = await prisma.supplier.create({data:newSupplier})
  })
  it("should delete successfully given valid id", async () => {
    const id = createdSupplier.id
    const res: SupplierResponse = await auth().delete(
      `/suppliers/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdSupplier) });

    const res2: ErrorResponse = await auth().get(`/suppliers/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Supplier not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/suppliers/badId");

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/suppliers/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Supplier not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
