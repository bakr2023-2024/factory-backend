import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { SupplierReturn } from "../../src/db/generated/prisma/client";
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

type SupplierReturnResponse = DataResponse<SupplierReturn>;
type PaginatedSupplierReturnsResponse = PaginationResponse<SupplierReturn[]>;

let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /supplierReturns", () => {
  it("should return all supplier returns", async () => {
    const res: PaginatedSupplierReturnsResponse =
      await auth().get("/supplierReturns");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.supplierReturns,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.supplierReturns.length / 20),
        totalCount: seed.supplierReturns.length,
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
        data: seed.supplierReturns.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.supplierReturns.length / 2),
        totalCount: seed.supplierReturns.length,
      }),
    );
  });

  it("should return all supplier returns given supplierId", async () => {
    const supplierId = seed.suppliers[0].id;

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?supplierId=${supplierId}`,
    );

    const filtered = seed.supplierReturns.filter(
      (supplierReturn) => supplierReturn.supplierId === supplierId,
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

  it("should return all supplier returns given supplierName", async () => {
    const supplierName = seed.suppliers[0].name;

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?supplierName=${encodeURIComponent(supplierName)}`,
    );

    const supplierIds = seed.suppliers
      .filter((supplier) => supplier.name === supplierName)
      .map((supplier) => supplier.id);

    const filtered = seed.supplierReturns.filter((supplierReturn) =>
      supplierIds.includes(supplierReturn.supplierId),
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

  it("should return all supplier returns given supplierNumber", async () => {
    const supplierNumber = seed.suppliers[1].number;

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?supplierNumber=${supplierNumber}`,
    );

    const supplierIds = seed.suppliers
      .filter((supplier) => supplier.number === supplierNumber)
      .map((supplier) => supplier.id);

    const filtered = seed.supplierReturns.filter((supplierReturn) =>
      supplierIds.includes(supplierReturn.supplierId),
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
  it("should return all supplier returns given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?productionDayId=${productionDayId}`,
    );
    const filtered = seed.supplierReturns.filter(
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
  it("should return all supplier returns given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.supplierReturns.filter((c) =>
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
  it("should return all supplier returns given occurredFrom", async () => {
    const occurredFrom = new Date("2026-10-03T12:00:00.000Z");

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?occurredFrom=${encodeURIComponent(
        occurredFrom.toISOString(),
      )}`,
    );

    const filtered = seed.supplierReturns.filter(
      (supplierReturn) => supplierReturn.occurredAt >= occurredFrom,
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

  it("should return all supplier returns given occurredTo", async () => {
    const occurredTo = new Date("2026-10-04T12:00:00.000Z");

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?occurredTo=${encodeURIComponent(
        occurredTo.toISOString(),
      )}`,
    );

    const filtered = seed.supplierReturns.filter(
      (supplierReturn) => supplierReturn.occurredAt <= occurredTo,
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

  it("should return all supplier returns given occurredFrom and occurredTo", async () => {
    const occurredFrom = new Date("2026-10-03T12:00:00.000Z");
    const occurredTo = new Date("2026-10-04T12:00:00.000Z");

    const res: PaginatedSupplierReturnsResponse = await auth().get(
      `/supplierReturns?occurredFrom=${encodeURIComponent(
        occurredFrom.toISOString(),
      )}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );

    const filtered = seed.supplierReturns.filter(
      (supplierReturn) =>
        supplierReturn.occurredAt >= occurredFrom &&
        supplierReturn.occurredAt <= occurredTo,
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

  it("should return all supplier returns sorted according to sortBy and order", async () => {
    const res: PaginatedSupplierReturnsResponse = await auth().get(
      "/supplierReturns?sortBy=occurredAt&order=desc",
    );

    const sorted = seed.supplierReturns.toSorted(
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

describe("GET /supplierReturns/:id", () => {
  it("should return supplier return given valid id", async () => {
    const supplierReturn = seed.supplierReturns[0];

    const res: SupplierReturnResponse = await auth().get(
      `/supplierReturns/${supplierReturn.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(supplierReturn),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/supplierReturns/badId");

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

  it("should fail if supplier return isn't found", async () => {
    const res: ErrorResponse = await auth().get("/supplierReturns/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("SupplierReturn not found");
  });
});

describe("POST /supplierReturns", () => {
  it("should create supplier return successfully given valid data", async () => {
    const payload = {
      supplierId: seed.suppliers[0].id,
      productionDayId: seed.productionDays[2].id,
      occurredAt: new Date("2026-10-11T12:00:00.000Z").toISOString(),
      notes: "POST test supplier return",
    };

    const res: SupplierReturnResponse = await auth()
      .post("/supplierReturns")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      ...payload,
      occurredAt: payload.occurredAt,
    });
    expect(res.body.data).toHaveProperty("id");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/supplierReturns").send({
      supplierId: -1,
      productionDayId: -1,
      occurredAt: "badDate",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["supplierId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
    ]);
  });

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth().post("/supplierReturns").send({
      supplierId: 99999999,
      productionDayId: seed.productionDays[2].id,
      occurredAt: "2026-10-11T12:00:00.000Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/supplierReturns").send({
      supplierId: seed.suppliers[2].id,
      productionDayId: 99999999,
      occurredAt: "2026-10-11T12:00:00.000Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
});

describe("PATCH /supplierReturns/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const supplierReturn = seed.supplierReturns[0];

    const res: SupplierReturnResponse = await auth()
      .patch(`/supplierReturns/${supplierReturn.id}`)
      .send({
        notes: "Updated notes",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...supplierReturn,
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
        message: "value can only be a positive integer",
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
      .patch(`/supplierReturns/${seed.supplierReturns[0].id}`)
      .send({
        supplierId: -1,
      });

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

  it("should fail if supplier isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/supplierReturns/${seed.supplierReturns[0].id}`)
      .send({
        supplierId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/supplierReturns/${seed.supplierReturns[0].id}`)
      .send({
        productionDayId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No supplier/productionDay exists with that ID",
    );
  });
});

describe("DELETE /supplierReturns/:id", () => {
  let createdSupplierReturn: SupplierReturn;
  beforeAll(async () => {
    createdSupplierReturn = await prisma.supplierReturn.create({
      data: {
        supplierId: seed.suppliers[0].id,
        productionDayId: seed.productionDays[1].id,
      },
    });
  });
  it("should delete successfully given valid id", async () => {
    const res: SupplierReturnResponse = await auth().delete(
      `/supplierReturns/${createdSupplierReturn.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdSupplierReturn),
    });

    const res2: ErrorResponse = await auth().get(
      `/supplierReturns/${createdSupplierReturn.id}`,
    );

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
        message: "value can only be a positive integer",
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
  await cleanDatabase();
  await prisma.$disconnect();
});
