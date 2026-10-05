import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Season, Week } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, login, auth } from "./helpers/auth";
import prisma from "../src/db/prisma";

type WeekResponse = DataResponse<Week>;
type PaginatedWeeksResponse = PaginationResponse<Week[]>;

const mockSeasons = [
  { name: "season 1", startDate: new Date("2026-09-24T00:00:00Z") },
  { name: "season 2", startDate: new Date("2026-09-27T00:00:00Z") },
  { name: "season 3", startDate: new Date("2026-09-30T00:00:00Z") },
];
let mockWeeks: { seasonId: number; startDate: Date }[] = [];
let createdSeasons: Season[];
beforeAll(async () => {
  await login();
  createdSeasons = await prisma.season.createManyAndReturn({
    data: mockSeasons,
  });
  mockWeeks.push({
    seasonId: createdSeasons[0].id,
    startDate: new Date("2026-09-24T00:00:00Z"),
  });
  mockWeeks.push({
    seasonId: createdSeasons[0].id,
    startDate: new Date("2026-09-27T00:00:00Z"),
  });
  mockWeeks.push({
    seasonId: createdSeasons[1].id,
    startDate: new Date("2026-09-30T00:00:00Z"),
  });
});
describe("GET /weeks", () => {
  let createdWeeks: Week[] = [];

  beforeAll(async () => {
    await prisma.week.deleteMany({});
    createdWeeks = await prisma.week.createManyAndReturn({
      data: mockWeeks,
    });
  });

  it("should return all weeks", async () => {
    const res: PaginatedWeeksResponse = await auth().get("/weeks");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdWeeks,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdWeeks.length,
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
        data: [createdWeeks[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all weeks that relate to queried season name or id", async () => {
    const res: PaginatedWeeksResponse = await auth().get(
      `/weeks?seasonName=season%201&seasonId=${createdSeasons[0].id}`,
    );
    const filtered = createdWeeks.filter((week) => {
      const season = createdSeasons[0];
      return week.seasonId === season.id;
    });
    const expectedRes = json({
      data: filtered,
      page: 1,
      size: 20,
      totalPages: 1,
      totalCount: filtered.length,
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expectedRes);
  });
  it("should return all weeks sorted according to sortBy and order", async () => {
    const res: PaginatedWeeksResponse = await auth().get(
      "/weeks?sortBy=startDate&order=desc",
    );
    const sorted = createdWeeks.toSorted(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
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
  it("should return all weeks that started between startedFrom and startedTo", async () => {
    const start = "2026-09-23";
    const end = "2026-09-28";
    const res: PaginatedWeeksResponse = await auth().get(
      `/weeks?startedFrom=${start}&startedTo=${end}`,
    );
    const filtered = createdWeeks.filter(
      ({ startDate }) =>
        startDate.toISOString() >= start && startDate.toISOString() < end,
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

describe("GET /weeks/:id", () => {
  let createdWeek: Week;

  beforeAll(async () => {
    await prisma.week.deleteMany({});
    createdWeek = await prisma.week.create({ data: mockWeeks[0] });
  });

  it("should return week given valid id", async () => {
    const id = createdWeek.id;
    const res: WeekResponse = await auth().get(`/weeks/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdWeek) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/weeks/badId");

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

  it("should fail if week isn't found", async () => {
    const res: ErrorResponse = await auth().get("/weeks/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Week not found");
  });
});

describe("POST /weeks", () => {
  beforeAll(async () => {
    await prisma.week.deleteMany({});
  });

  it("should create week successfully given data", async () => {
    const res: WeekResponse = await auth()
      .post("/weeks")
      .send({
        ...mockWeeks[0],
        startDate: mockWeeks[0].startDate.toISOString().slice(0, 10),
      });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(json({ data: mockWeeks[0] }));
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
        message: "ID can only be a positive integer",
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
    expect(res.body.message).toBe("No season exists with this ID");
  });
});

describe("PATCH /weeks/:id", () => {
  let createdWeek: Week;
  beforeAll(async () => {
    await prisma.week.deleteMany({});
    createdWeek = await prisma.week.create({ data: mockWeeks[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdWeek.id;
    const res: WeekResponse = await auth()
      .patch(`/weeks/${id}`)
      .send({ seasonId: createdSeasons[1].id });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdWeek,
          seasonId: createdSeasons[1].id,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/weeks/badId")
      .send({ seasonId: createdSeasons[1].id });

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
  it("should fail if week isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/weeks/99999999")
      .send({ seasonId: createdSeasons[1].id });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Week not found");
  });
  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/weeks/${createdWeek.id}`)
      .send({ seasonId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["seasonId"],
      },
    ]);
  });
  it("should fail if season is not found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/weeks/${createdWeek.id}`)
      .send({ seasonId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No season exists with that ID");
  });
});

describe("DELETE /weeks/:id", () => {
  let createdWeek: Week;

  beforeAll(async () => {
    await prisma.week.deleteMany({});
    createdWeek = await prisma.week.create({ data: mockWeeks[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdWeek.id;
    const res: WeekResponse = await auth().delete(`/weeks/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdWeek) });

    const res2: ErrorResponse = await auth().get(`/weeks/${id}`);

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
        message: "ID can only be a positive integer",
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
  await prisma.week.deleteMany({});
  await prisma.$disconnect();
});
