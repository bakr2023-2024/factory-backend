import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Import } from "../../src/db/generated/prisma/client";
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

type ImportResponse = DataResponse<Import>;
type PaginatedImportsResponse = PaginationResponse<Import[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /imports", () => {
  it("should return all imports", async () => {
    const res: PaginatedImportsResponse = await auth().get("/imports");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.imports,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.imports.length / 20),
        totalCount: seed.imports.length,
      }),
    );
  });

  it("should return paginated imports given page and size", async () => {
    const res: PaginatedImportsResponse = await auth().get(
      "/imports?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.imports.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.imports.length / 2),
        totalCount: seed.imports.length,
      }),
    );
  });

  it("should return all imports that relate to supplierId", async () => {
    const supplierId = seed.suppliers[0].id;
    const res: PaginatedImportsResponse = await auth().get(
      `/imports?supplierId=${supplierId}`,
    );
    const filtered = seed.imports.filter((i) => i.supplierId === supplierId);

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
  it("should return all imports given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedImportsResponse = await auth().get(
      `/imports?productionDayId=${productionDayId}`,
    );
    const filtered = seed.imports.filter(
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
  it("should return all imports given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedImportsResponse = await auth().get(
      `/imports?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.imports.filter((c) =>
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

  it("should return all imports that occurred between occurredFrom and occurredTo", async () => {
    const start = new Date(seed.imports[0].occurredAt.getTime() + 3600000);
    const end = new Date(seed.imports[2].occurredAt.getTime() - 3600000);
    const res: PaginatedImportsResponse = await auth().get(
      `/imports?occurredFrom=${encodeURIComponent(start.toISOString())}&occurredTo=${encodeURIComponent(end.toISOString())}`,
    );
    const filtered = seed.imports.filter(
      (i) => i.occurredAt >= start && i.occurredAt <= end,
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

  it("should return all imports sorted according to sortBy and order", async () => {
    const res: PaginatedImportsResponse = await auth().get(
      "/imports?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.imports.toSorted(
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

describe("GET /imports/:id", () => {
  it("should return import given valid id", async () => {
    const importRow = seed.imports[0];
    const res: ImportResponse = await auth().get(`/imports/${importRow.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(importRow) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/imports/badId");

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

  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await auth().get("/imports/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Import not found");
  });
});

describe("POST /imports", () => {
  it("should create import successfully given supplierId", async () => {
    const supplierId = seed.suppliers[0].id;
    const productionDayId = seed.productionDays[0].id;
    const res: ImportResponse = await auth()
      .post("/imports")
      .send({ supplierId, productionDayId });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: { supplierId, productionDayId } });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/imports")
      .send({ supplierId: -1, productionDayId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["supplierId"],
      },
    ]);
  });

  it("should fail given non-existent supplierId", async () => {
    const res: ErrorResponse = await auth().post("/imports").send({
      supplierId: 99999999,
      productionDayId: seed.productionDays[0].id,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/imports").send({
      productionDayId: 99999999,
      supplierId: seed.suppliers[2].id,
      occurredAt: "2026-10-10T09:00:00.000Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
});

describe("PATCH /imports/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const importRow = seed.imports[0];
    const supplierId = seed.suppliers[1].id;
    const res: ImportResponse = await auth()
      .patch(`/imports/${importRow.id}`)
      .send({ supplierId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...importRow, supplierId }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/imports/badId")
      .send({ supplierId: seed.suppliers[1].id });

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

  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/imports/99999999")
      .send({ supplierId: seed.suppliers[0].id });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Import not found");
  });

  it("should fail given invalid supplierId", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/imports/${seed.imports[0].id}`)
      .send({ supplierId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["supplierId"],
      },
    ]);
  });

  it("should fail given non-existent supplier", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/imports/${seed.imports[0].id}`)
      .send({ supplierId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
  it("should fail given non-existent productionDay", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/imports/${seed.imports[0].id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
});

describe("DELETE /imports/:id", () => {
  // every seeded import has import items, so delete one with no children
  let createdImport: Import;

  beforeAll(async () => {
    createdImport = await prisma.import.create({
      data: {
        supplierId: seed.suppliers[0].id,
        productionDayId: seed.productionDays[0].id,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdImport.id;
    const res: ImportResponse = await auth().delete(`/imports/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdImport) });

    const res2: ErrorResponse = await auth().get(`/imports/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Import not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/imports/badId");

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

  it("should fail if import isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/imports/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Import not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
