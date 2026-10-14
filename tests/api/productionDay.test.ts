import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { ProductionDay } from "../../src/db/generated/prisma/client";
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

type ProductionDayResponse = DataResponse<ProductionDay>;
type PaginatedProductionDaysResponse = PaginationResponse<ProductionDay[]>;

let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /productionDays", () => {
  it("should return all production days", async () => {
    const res: PaginatedProductionDaysResponse =
      await auth().get("/productionDays");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.productionDays,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: seed.productionDays.length,
      }),
    );
  });

  it("should return paginated production days given page and size", async () => {
    const res: PaginatedProductionDaysResponse = await auth().get(
      "/productionDays?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [seed.productionDays[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: seed.productionDays.length,
      }),
    );
  });

  it("should return production days given weekId", async () => {
    const weekId = seed.weeks[0].id;

    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?weekId=${weekId}`,
    );

    const filtered = seed.productionDays.filter(
      (productionDay) => productionDay.weekId === weekId,
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

  it("should return production days given productionDate", async () => {
    const productionDate = seed.productionDays[1].productionDate
      .toISOString()
      .slice(0, 10);

    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?productionDate=${productionDate}`,
    );

    const filtered = seed.productionDays.filter(
      (productionDay) =>
        productionDay.productionDate.toISOString().slice(0, 10) ===
        productionDate,
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

  it("should return production days started between startedFrom and startedTo", async () => {
    const startedFrom = seed.productionDays[0].startedAt.toISOString();
    const startedTo = seed.productionDays[2].startedAt.toISOString();

    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?startedFrom=${startedFrom}&startedTo=${startedTo}`,
    );

    const from = new Date(startedFrom);
    const to = new Date(startedTo);

    const filtered = seed.productionDays.filter(
      ({ startedAt }) => startedAt >= from && startedAt <= to,
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

  it("should return production days ended between endedFrom and endedTo", async () => {
    const endedFrom = seed.productionDays[0].productionDate.toISOString();
    const endedTo = new Date(
      seed.productionDays[2].productionDate.getTime() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?endedFrom=${endedFrom}&endedTo=${endedTo}`,
    );

    const from = new Date(endedFrom);
    const to = new Date(endedTo);

    const filtered = seed.productionDays.filter(
      ({ endedAt }) => endedAt !== null && endedAt >= from && endedAt <= to,
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

  it("should return all production days sorted according to sortBy and order", async () => {
    const res: PaginatedProductionDaysResponse = await auth().get(
      "/productionDays?sortBy=startedAt&order=desc",
    );

    const sorted = seed.productionDays.toSorted(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime(),
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

describe("GET /productionDays/:id", () => {
  it("should return production day given valid id", async () => {
    const productionDay = seed.productionDays[0];

    const res: ProductionDayResponse = await auth().get(
      `/productionDays/${productionDay.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(productionDay),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/productionDays/badId");

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

  it("should fail if production day isn't found", async () => {
    const res: ErrorResponse = await auth().get("/productionDays/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionDay not found");
  });
});

describe("POST /productionDays", () => {
  it("should create production day successfully", async () => {
    const body = {
      weekId: seed.weeks[0].id,
      productionDate: "2026-10-30",
      startedAt: "2026-10-30T07:00:00Z",
      endedAt: "2026-10-30T15:00:00Z",
      notes: "New production day",
    };

    const res: ProductionDayResponse = await auth()
      .post("/productionDays")
      .send(body);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: {
        weekId: body.weekId,
        productionDate: expect.any(String),
        startedAt: expect.any(String),
        endedAt: expect.any(String),
        notes: body.notes,
      },
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/productionDays").send({
      weekId: -1,
      productionDate: "0000-00-00",
      startedAt: "invalid",
      endedAt: "invalid",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["weekId"],
      },
      {
        key: "body",
        message: "Invalid Date",
        path: ["productionDate"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["startedAt"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["endedAt"],
      },
    ]);
  });

  it("should fail if week is not found", async () => {
    const res: ErrorResponse = await auth().post("/productionDays").send({
      weekId: 99999999,
      productionDate: "2026-10-31",
      startedAt: "2026-10-31T07:00:00Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No week exists with that ID");
  });
});

describe("PATCH /productionDays/:id", () => {
  it("should correctly update fields", async () => {
    const productionDay = seed.productionDays[0];

    const res: ProductionDayResponse = await auth()
      .patch(`/productionDays/${productionDay.id}`)
      .send({
        notes: "Updated notes",
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json(productionDay),
        notes: "Updated notes",
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionDays/badId")
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

  it("should fail if production day isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/productionDays/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionDay not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionDays/${seed.productionDays[0].id}`)
      .send({
        weekId: -1,
        productionDate: "invalid",
        startedAt: "invalid",
        endedAt: "invalid",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["weekId"],
      },
      {
        key: "body",
        message: "Invalid Date",
        path: ["productionDate"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["startedAt"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["endedAt"],
      },
    ]);
  });

  it("should fail if week is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/productionDays/${seed.productionDays[0].id}`)
      .send({
        weekId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No week exists with that ID");
  });
});

describe("DELETE /productionDays/:id", () => {
  let createdProductionDay: ProductionDay;

  beforeAll(async () => {
    createdProductionDay = await prisma.productionDay.create({
      data: {
        weekId: seed.weeks[0].id,
        productionDate: new Date("2026-10-31T00:00:00.000Z"),
        startedAt: new Date("2026-10-31T07:00:00.000Z"),
        endedAt: new Date("2026-10-31T15:00:00.000Z"),
        notes: "Production day for delete tests",
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdProductionDay.id;

    const res: ProductionDayResponse = await auth().delete(
      `/productionDays/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdProductionDay),
    });

    const res2: ErrorResponse = await auth().get(`/productionDays/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("ProductionDay not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/productionDays/badId");

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

  it("should fail if production day isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/productionDays/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionDay not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
