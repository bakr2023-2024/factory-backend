import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Supplier, SupplierReturn } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, auth, login } from "./helpers/auth";
import prisma from "../src/db/prisma";

type SupplierReturnResponse = DataResponse<SupplierReturn>;
type PaginatedSupplierReturnsResponse = PaginationResponse<SupplierReturn[]>;

const mockSuppliers = [
  {
    name: "Supplier One",
    number: "01000000001",
    notes: "First supplier",
  },
  {
    name: "Supplier Two",
    number: "01000000002",
    notes: "Second supplier",
  },
  {
    name: "Supplier Three",
    number: "01000000003",
  },
];

let createdSuppliers: Supplier[];

const mockSupplierReturns: {
  supplierId: number;
  occurredAt: Date;
  notes?: string;
}[] = [];

beforeAll(async () => {
  await login();

  await prisma.supplierReturnItem.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.importItem.deleteMany({});
  await prisma.import.deleteMany({});
  await prisma.supplier.deleteMany({});

  createdSuppliers = await prisma.supplier.createManyAndReturn({
    data: mockSuppliers,
  });

  mockSupplierReturns.push(
    {
      supplierId: createdSuppliers[0].id,
      occurredAt: new Date("2026-09-24T09:00:00Z"),
      notes: "First return",
    },
    {
      supplierId: createdSuppliers[0].id,
      occurredAt: new Date("2026-09-24T10:00:00Z"),
      notes: "Second return",
    },
    {
      supplierId: createdSuppliers[1].id,
      occurredAt: new Date("2026-09-25T09:00:00Z"),
      notes: "Third return",
    },
    {
      supplierId: createdSuppliers[2].id,
      occurredAt: new Date("2026-09-27T09:00:00Z"),
    },
  );
});

describe("GET /supplierReturns", () => {
  let createdSupplierReturns: SupplierReturn[] = [];

  beforeAll(async () => {
    createdSupplierReturns = await prisma.supplierReturn.createManyAndReturn({
      data: mockSupplierReturns,
    });
  });

  it("should return all supplier returns", async () => {
    const res: PaginatedSupplierReturnsResponse =
      await auth().get("/supplierReturns");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdSupplierReturns,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdSupplierReturns.length,
      }),
    );
  });

  it("should return paginated supplier returns given page and size", async () => {
    const res: PaginatedSupplierReturnsResponse = await auth().get(
      "/supplierReturns?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdSupplierReturns[2], createdSupplierReturns[3]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 4,
      }),
    );
  });

  it("should return all supplier returns given supplierId", async () => {
    const supplierId = createdSuppliers[0].id;

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?supplierId=${supplierId}`,
    );

    const filtered = createdSupplierReturns.filter(
      (supplierReturn) => supplierReturn.supplierId === supplierId,
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

  it("should return all supplier returns given supplierName", async () => {
    const supplierName = "Supplier One";

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?supplierName=${encodeURIComponent(supplierName)}`,
    );

    const supplierIds = createdSuppliers
      .filter((supplier) => supplier.name === supplierName)
      .map((supplier) => supplier.id);

    const filtered = createdSupplierReturns.filter((supplierReturn) =>
      supplierIds.includes(supplierReturn.supplierId),
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

  it("should return all supplier returns given supplierNumber", async () => {
    const supplierNumber = "01000000002";

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?supplierNumber=${supplierNumber}`,
    );

    const supplierIds = createdSuppliers
      .filter((supplier) => supplier.number === supplierNumber)
      .map((supplier) => supplier.id);

    const filtered = createdSupplierReturns.filter((supplierReturn) =>
      supplierIds.includes(supplierReturn.supplierId),
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

  it("should return all supplier returns given occurredFrom", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?occurredFrom=${encodeURIComponent(occurredFrom)}`,
    );

    const filtered = createdSupplierReturns.filter(
      (supplierReturn) => supplierReturn.occurredAt >= new Date(occurredFrom),
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

  it("should return all supplier returns given occurredTo", async () => {
    const occurredTo = "2026-09-25T09:00:00.000Z";

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = createdSupplierReturns.filter(
      (supplierReturn) => supplierReturn.occurredAt <= new Date(occurredTo),
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

  it("should return all supplier returns given occurredFrom and occurredTo", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";
    const occurredTo = "2026-09-25T09:00:00.000Z";

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?occurredFrom=${encodeURIComponent(
        occurredFrom,
      )}&occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = createdSupplierReturns.filter(
      (supplierReturn) =>
        supplierReturn.occurredAt >= new Date(occurredFrom) &&
        supplierReturn.occurredAt <= new Date(occurredTo),
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

  it("should return all supplier returns sorted according to sortBy and order", async () => {
    const res: PaginatedSupplierReturnsResponse = await auth().get(
      "/supplierReturns?sortBy=occurredAt&order=desc",
    );

    const sorted = createdSupplierReturns.toSorted(
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

describe("GET /supplierReturns/:id", () => {
  let createdSupplierReturn: SupplierReturn;

  beforeAll(async () => {
    await prisma.supplierReturn.deleteMany({});

    createdSupplierReturn = await prisma.supplierReturn.create({
      data: mockSupplierReturns[0],
    });
  });

  it("should return supplier return given valid id", async () => {
    const id = createdSupplierReturn.id;

    const res: SupplierReturnResponse = await auth().get(
      `/supplierReturns/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdSupplierReturn),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/supplierReturns/badId");

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

  it("should fail if supplier return isn't found", async () => {
    const res: ErrorResponse = await auth().get("/supplierReturns/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturn not found");
  });
});

describe("POST /supplierReturns", () => {
  beforeAll(async () => {
    await prisma.supplierReturn.deleteMany({});
  });

  it("should create supplier return successfully given valid data", async () => {
    const res: SupplierReturnResponse = await auth()
      .post("/supplierReturns")
      .send(mockSupplierReturns[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({
        data: mockSupplierReturns[0],
      }),
    );
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/supplierReturns").send({
      supplierId: -1,
      occurredAt: "badDate",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["supplierId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
    ]);
  });

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/supplierReturns")
      .send({
        ...mockSupplierReturns[0],
        supplierId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No supplier exists with that ID");
  });
});

describe("PATCH /supplierReturns/:id", () => {
  let createdSupplierReturn: SupplierReturn;

  beforeAll(async () => {
    await prisma.supplierReturn.deleteMany({});

    createdSupplierReturn = await prisma.supplierReturn.create({
      data: mockSupplierReturns[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdSupplierReturn.id;

    const res: SupplierReturnResponse = await auth()
      .patch(`/supplierReturns/${id}`)
      .send({
        notes: "Updated notes",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdSupplierReturn,
          notes: "Updated notes",
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/supplierReturns/badId")
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

  it("should fail if supplier return isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/supplierReturns/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturn not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/supplierReturns/${createdSupplierReturn.id}`)
      .send({
        supplierId: -1,
      });

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/supplierReturns/${createdSupplierReturn.id}`)
      .send({
        supplierId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No supplier exists with that ID");
  });
});

describe("DELETE /supplierReturns/:id", () => {
  let createdSupplierReturn: SupplierReturn;

  beforeAll(async () => {
    await prisma.supplierReturn.deleteMany({});

    createdSupplierReturn = await prisma.supplierReturn.create({
      data: mockSupplierReturns[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdSupplierReturn.id;

    const res: SupplierReturnResponse = await auth().delete(
      `/supplierReturns/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdSupplierReturn),
    });

    const res2: ErrorResponse = await auth().get(`/supplierReturns/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("SupplierReturn not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/supplierReturns/badId");

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

  it("should fail if supplier return isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/supplierReturns/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturn not found");
  });
});

afterAll(async () => {
  await prisma.supplierReturnItem.deleteMany({});
  await prisma.supplierReturn.deleteMany({});
  await prisma.importItem.deleteMany({});
  await prisma.import.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.$disconnect();
});
