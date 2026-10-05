import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { ProductionDay, Season, Week } from "../src/db/generated/prisma/client";

import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";

import { json, login, auth } from "./helpers/auth";
import prisma from "../src/db/prisma";

type ProductionDayResponse = DataResponse<ProductionDay>;
type PaginatedProductionDaysResponse = PaginationResponse<ProductionDay[]>;

let createdSeason: Season;
let createdWeeks: Week[];

const mockSeason = {
  name: "season 1",
  startDate: new Date("2026-09-24T00:00:00Z"),
};

const mockWeeks = [
  {
    startDate: new Date("2026-09-24T00:00:00Z"),
  },
  {
    startDate: new Date("2026-09-27T00:00:00Z"),
  },
];

let mockProductionDays: {
  weekId: number;
  productionDate: string;
  startedAt: string;
  endedAt: string;
  notes?: string;
}[];

beforeAll(async () => {
  await login();

  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});

  createdSeason = await prisma.season.create({
    data: mockSeason,
  });

  createdWeeks = await prisma.week.createManyAndReturn({
    data: mockWeeks.map((week) => ({
      ...week,
      seasonId: createdSeason.id,
    })),
  });

  mockProductionDays = [
    {
      weekId: createdWeeks[0].id,
      productionDate: "2026-09-24",
      startedAt: "2026-09-24T07:00:00Z",
      endedAt: "2026-09-24T15:00:00Z",
      notes: "Production day 1",
    },
    {
      weekId: createdWeeks[0].id,
      productionDate: "2026-09-25",
      startedAt: "2026-09-25T08:00:00Z",
      endedAt: "2026-09-25T16:00:00Z",
      notes: "Production day 2",
    },
    {
      weekId: createdWeeks[1].id,
      productionDate: "2026-09-27",
      startedAt: "2026-09-27T09:00:00Z",
      endedAt: "2026-09-27T17:00:00Z",
      notes: "Production day 3",
    },
  ];
});

describe("GET /productionDays", () => {
  let createdProductionDays: ProductionDay[] = [];

  beforeAll(async () => {
    await prisma.productionDay.deleteMany({});

    createdProductionDays = await prisma.productionDay.createManyAndReturn({
      data: mockProductionDays.map((day) => ({
        ...day,
        productionDate: new Date(day.productionDate),
        startedAt: new Date(day.startedAt),
        endedAt: new Date(day.endedAt),
      })),
    });
  });

  it("should return all production days", async () => {
    const res: PaginatedProductionDaysResponse =
      await auth().get("/productionDays");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdProductionDays,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdProductionDays.length,
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
        data: [createdProductionDays[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return production days given weekId", async () => {
    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?weekId=${createdWeeks[0].id}`,
    );

    const filtered = createdProductionDays.filter(
      (productionDay) => productionDay.weekId === createdWeeks[0].id,
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

  it("should return production day given productionDate", async () => {
    const productionDate = "2026-09-25";

    const res: ProductionDayResponse = await auth().get(
      `/productionDays?productionDate=${productionDate}`,
    );
    const filtered = createdProductionDays.filter(
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
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return production days started between startedFrom and startedTo", async () => {
    const startedFrom = "2026-09-24T07:30:00Z";
    const startedTo = "2026-09-27T08:30:00Z";

    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?startedFrom=${startedFrom}&startedTo=${startedTo}`,
    );

    const from = new Date(startedFrom);
    const to = new Date(startedTo);

    const filtered = createdProductionDays.filter(
      ({ startedAt }) => startedAt >= from && startedAt <= to,
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

  it("should return production days ended between endedFrom and endedTo", async () => {
    const endedFrom = "2026-09-24T14:00:00Z";
    const endedTo = "2026-09-27T16:00:00Z";

    const res: PaginatedProductionDaysResponse = await auth().get(
      `/productionDays?endedFrom=${endedFrom}&endedTo=${endedTo}`,
    );

    const from = new Date(endedFrom);
    const to = new Date(endedTo);

    const filtered = createdProductionDays.filter(
      ({ endedAt }) => endedAt !== null && endedAt >= from && endedAt <= to,
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

  it("should return all production days sorted according to sortBy and order", async () => {
    const res: PaginatedProductionDaysResponse = await auth().get(
      "/productionDays?sortBy=startedAt&order=desc",
    );
    const sorted = createdProductionDays.toSorted(
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
  let createdProductionDay: ProductionDay;

  beforeAll(async () => {
    await prisma.productionDay.deleteMany({});

    createdProductionDay = await prisma.productionDay.create({
      data: {
        ...mockProductionDays[0],
        productionDate: new Date(mockProductionDays[0].productionDate),
        startedAt: new Date(mockProductionDays[0].startedAt),
        endedAt: new Date(mockProductionDays[0].endedAt),
      },
    });
  });

  it("should return production day given valid id", async () => {
    const id = createdProductionDay.id;

    const res: ProductionDayResponse = await auth().get(
      `/productionDays/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdProductionDay),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/productionDays/badId");

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

  it("should fail if production day isn't found", async () => {
    const res: ErrorResponse = await auth().get("/productionDays/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionDay not found");
  });
});

describe("POST /productionDays", () => {
  beforeAll(async () => {
    await prisma.productionDay.deleteMany({});
  });

  it("should create production day successfully", async () => {
    const res: ProductionDayResponse = await auth()
      .post("/productionDays")
      .send(mockProductionDays[0]);
      
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: {
        weekId: mockProductionDays[0].weekId,
        productionDate: expect.any(String),
        startedAt: expect.any(String),
        endedAt: expect.any(String),
        notes: mockProductionDays[0].notes,
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
        message: "ID can only be a positive integer",
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
      productionDate: "2026-10-01",
      startedAt: "2026-10-01T07:00:00Z",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No week exists with that ID");
  });
});

describe("PATCH /productionDays/:id", () => {
  let createdProductionDay: ProductionDay;

  beforeAll(async () => {
    await prisma.productionDay.deleteMany({});

    createdProductionDay = await prisma.productionDay.create({
      data: {
        ...mockProductionDays[0],
        productionDate: new Date(mockProductionDays[0].productionDate),
        startedAt: new Date(mockProductionDays[0].startedAt),
        endedAt: new Date(mockProductionDays[0].endedAt),
      },
    });
  });

  it("should correctly update fields", async () => {
    const id = createdProductionDay.id;

    const res: ProductionDayResponse = await auth()
      .patch(`/productionDays/${id}`)
      .send({
        notes: "Updated notes",
      });

    expect(res.status).toBe(200);

    expect(res.body).toEqual({
      data: {
        ...json(createdProductionDay),
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
        message: "ID can only be a positive integer",
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
      .patch(`/productionDays/${createdProductionDay.id}`)
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
        message: "ID can only be a positive integer",
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
      .patch(`/productionDays/${createdProductionDay.id}`)
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
    await prisma.productionDay.deleteMany({});

    createdProductionDay = await prisma.productionDay.create({
      data: {
        ...mockProductionDays[0],
        productionDate: new Date(mockProductionDays[0].productionDate),
        startedAt: new Date(mockProductionDays[0].startedAt),
        endedAt: new Date(mockProductionDays[0].endedAt),
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
        message: "ID can only be a positive integer",
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
  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.$disconnect();
});
