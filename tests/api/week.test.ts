import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Week } from "../../src/db/generated/prisma/client";
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

type WeekResponse = DataResponse<Week>;
type PaginatedWeeksResponse = PaginationResponse<Week[]>;

let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /weeks", () => {
  it("should return all weeks", async () => {
    const res: PaginatedWeeksResponse = await auth().get("/weeks");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.weeks,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.weeks.length / 20),
        totalCount: seed.weeks.length,
      }),
    );
  });

  it("should return paginated weeks given page and size", async () => {
    const res: PaginatedWeeksResponse = await auth().get(
      "/weeks?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.weeks.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.weeks.length / 2),
        totalCount: seed.weeks.length,
      }),
    );
  });

  it("should return all weeks that relate to queried season name and id", async () => {
    const season = seed.seasons[0];

    const res: PaginatedWeeksResponse = await auth().get(
      `/weeks?seasonName=${season.name}&seasonId=${season.id}`,
    );

    const filtered = seed.weeks.filter((week) => week.seasonId === season.id);

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

  it("should return all weeks sorted according to sortBy and order", async () => {
    const res: PaginatedWeeksResponse = await auth().get(
      "/weeks?sortBy=startDate&order=desc",
    );

    const sorted = seed.weeks.toSorted(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
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

  it("should return all weeks that started between startedFrom and startedTo", async () => {
    const start = "2026-09-23";
    const end = "2026-09-28";

    const res: PaginatedWeeksResponse = await auth().get(
      `/weeks?startedFrom=${start}&startedTo=${end}`,
    );

    const filtered = seed.weeks.filter(
      ({ startDate }) =>
        startDate.toISOString() >= start && startDate.toISOString() < end,
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
});

describe("GET /weeks/:id", () => {
  it("should return week given valid id", async () => {
    const week = seed.weeks[0];

    const res: WeekResponse = await auth().get(`/weeks/${week.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(week) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/weeks/badId");

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

  it("should fail if week isn't found", async () => {
    const res: ErrorResponse = await auth().get("/weeks/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Week not found");
  });
});

describe("POST /weeks", () => {
  it("should create week successfully given data", async () => {
    const payload = {
      seasonId: seed.seasons[0].id,
      startDate: "2026-10-15",
    };

    const res: WeekResponse = await auth().post("/weeks").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      data: {
        seasonId: payload.seasonId,
        startDate: expect.any(String),
      },
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/weeks")
      .send({ seasonId: -1, startDate: "0000-00-00T00:00:00Z" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["seasonId"],
      },
      {
        key: "body",
        message: "Invalid Date",
        path: ["startDate"],
      },
    ]);
  });

  it("should fail if season is not found", async () => {
    const res: ErrorResponse = await auth()
      .post("/weeks")
      .send({ seasonId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No season exists with that ID");
  });
});

describe("PATCH /weeks/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const week = seed.weeks[0];

    const res: WeekResponse = await auth()
      .patch(`/weeks/${week.id}`)
      .send({ seasonId: seed.seasons[1].id });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...week,
          seasonId: seed.seasons[1].id,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/weeks/badId")
      .send({ seasonId: seed.seasons[1].id });

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

  it("should fail if week isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/weeks/99999999")
      .send({ seasonId: seed.seasons[1].id });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Week not found");
  });

  it("should fail given invalid data", async () => {
    const week = seed.weeks[0];

    const res: ErrorResponse = await auth()
      .patch(`/weeks/${week.id}`)
      .send({ seasonId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["seasonId"],
      },
    ]);
  });

  it("should fail if season is not found", async () => {
    const week = seed.weeks[0];

    const res: ErrorResponse = await auth()
      .patch(`/weeks/${week.id}`)
      .send({ seasonId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No season exists with that ID");
  });
});

describe("DELETE /weeks/:id", () => {
  it("should delete successfully given valid id", async () => {
    // Use an isolated week so the seeded production days remain untouched.
    const week = await prisma.week.create({
      data: {
        seasonId: seed.seasons[2].id,
        startDate: new Date("2026-10-15T00:00:00Z"),
      },
    });

    const res: WeekResponse = await auth().delete(`/weeks/${week.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(week) });

    const res2: ErrorResponse = await auth().get(`/weeks/${week.id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Week not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/weeks/badId");

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

  it("should fail if week isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/weeks/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Week not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
