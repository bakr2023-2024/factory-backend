import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Export } from "../../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../../src/utils/types/response.types";
import prisma from "../../src/db/prisma";
import {
  json,
  auth,
  login,
  cleanDatabase,
  populateDatabase,
  MockData,
} from "../utils";

type ExportResponse = DataResponse<Export>;
type PaginatedExportsResponse = PaginationResponse<Export[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /exports", () => {
  it("should return all exports", async () => {
    const res: PaginatedExportsResponse = await auth().get("/exports");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.exports,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.exports.length / 20),
        totalCount: seed.exports.length,
      }),
    );
  });

  it("should return paginated exports given page and size", async () => {
    const res: PaginatedExportsResponse = await auth().get(
      "/exports?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.exports.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.exports.length / 2),
        totalCount: seed.exports.length,
      }),
    );
  });

  it("should return all exports that relate to customerId", async () => {
    const customerId = seed.customers[0].id;
    const res: PaginatedExportsResponse = await auth().get(
      `/exports?customerId=${customerId}`,
    );
    const filtered = seed.exports.filter((e) => e.customerId === customerId);

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
  it("should return all exports given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedExportsResponse = await auth().get(
      `/exports?productionDayId=${productionDayId}`,
    );
    const filtered = seed.exports.filter(
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
  it("should return all exports given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedExportsResponse = await auth().get(
      `/exports?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.exports.filter((c) =>
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

  it("should return all exports that occurred between occurredFrom and occurredTo", async () => {
    const start = new Date(seed.exports[0].occurredAt.getTime() + 3600000);
    const end = new Date(seed.exports[2].occurredAt.getTime() - 3600000);
    const res: PaginatedExportsResponse = await auth().get(
      `/exports?occurredFrom=${encodeURIComponent(start.toISOString())}&occurredTo=${encodeURIComponent(end.toISOString())}`,
    );
    const filtered = seed.exports.filter(
      (e) => e.occurredAt >= start && e.occurredAt <= end,
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

  it("should return all exports sorted according to sortBy and order", async () => {
    const res: PaginatedExportsResponse = await auth().get(
      "/exports?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.exports.toSorted(
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

describe("GET /exports/:id", () => {
  it("should return export given valid id", async () => {
    const exportRow = seed.exports[0];
    const res: ExportResponse = await auth().get(`/exports/${exportRow.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(exportRow) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/exports/badId");

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

  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await auth().get("/exports/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Export not found");
  });
});

describe("POST /exports", () => {
  it("should create export successfully given customerId", async () => {
    const customerId = seed.customers[0].id;
    const productionDayId = seed.productionDays[0].id;
    const res: ExportResponse = await auth()
      .post("/exports")
      .send({ customerId, productionDayId });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: { customerId, productionDayId } });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/exports")
      .send({ customerId: -1, productionDayId: -1 });

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
        path: ["customerId"],
      },
    ]);
  });

  it("should fail given non-existent customerId", async () => {
    const res: ErrorResponse = await auth().post("/exports").send({
      customerId: 99999999,
      productionDayId: seed.productionDays[0].id,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with this ID",
    );
  });
  it("should fail given non-existent productionDayId", async () => {
    const res: ErrorResponse = await auth().post("/exports").send({
      productionDayId: 99999999,
      customerId: seed.customers[0].id,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with this ID",
    );
  });
});

describe("PATCH /exports/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const exportRow = seed.exports[0];
    const customerId = seed.customers[1].id;
    const res: ExportResponse = await auth()
      .patch(`/exports/${exportRow.id}`)
      .send({ customerId });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...exportRow, customerId }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/exports/badId")
      .send({ customerId: seed.customers[1].id });

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

  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/exports/99999999")
      .send({ customerId: seed.customers[0].id });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Export not found");
  });

  it("should fail given invalid customerId", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/exports/${seed.exports[0].id}`)
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

  it("should fail given non-existent customer", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/exports/${seed.exports[0].id}`)
      .send({ customerId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with that ID",
    );
  });
  it("should fail given non-existent productionDayId", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/exports/${seed.exports[0].id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No customer/productionDay exists with that ID",
    );
  });
});

describe("DELETE /exports/:id", () => {
  // every seeded export has export items, so delete one with no children
  let createdExport: Export;

  beforeAll(async () => {
    createdExport = await prisma.export.create({
      data: {
        customerId: seed.customers[0].id,
        productionDayId: seed.productionDays[0].id,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdExport.id;
    const res: ExportResponse = await auth().delete(`/exports/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdExport) });

    const res2: ErrorResponse = await auth().get(`/exports/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Export not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/exports/badId");

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

  it("should fail if export isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/exports/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Export not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
