import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Season } from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, login,auth } from "./helpers/auth";
import prisma from "../src/db/prisma";

type SeasonResponse = DataResponse<Season>;
type PaginatedSeasonsResponse = PaginationResponse<Season[]>;

beforeAll(async()=>{
  await login()
})
const mockSeasons = [
  { name: "season 1", startDate: new Date("2026-09-24T00:00:00Z") },
  { name: "season 2", startDate: new Date("2026-09-25T00:00:00Z") },
  { name: "season 3", startDate: new Date("2026-09-27T00:00:00Z") },
];
describe("GET /seasons", () => {
  let createdSeasons: Season[] = [];

  beforeAll(async () => {
    await prisma.season.deleteMany({});
    createdSeasons = await prisma.season.createManyAndReturn({
      data: mockSeasons,
    });
  });

  it("should return all seasons", async () => {
    const res: PaginatedSeasonsResponse = await auth().get("/seasons");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdSeasons,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdSeasons.length,
      }),
    );
  });

  it("should return paginated seasons given page and size", async () => {
    const res: PaginatedSeasonsResponse = await auth().get(
      "/seasons?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: [createdSeasons[2]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 3,
      }),
    );
  });

  it("should return all seasons that relate to queried name", async () => {
    const res: PaginatedSeasonsResponse = await auth().get(
      "/seasons?name=season%203",
    );
    const filtered = createdSeasons.filter(
      (season) => season.name === createdSeasons[2].name,
    );
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
  it("should return all seasons sorted according to sortBy and order", async () => {
    const res: PaginatedSeasonsResponse = await auth().get(
      "/seasons?sortBy=startDate&order=desc",
    );
    const sorted = createdSeasons.toSorted(
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
  it("should return all seasons that started between startedFrom and startedTo", async () => {
    const start = "2026-09-23";
    const end = "2026-09-26";
    const res: PaginatedSeasonsResponse = await auth().get(
      `/seasons?startedFrom=${start}&startedTo=${end}`,
    );
    const filtered = createdSeasons.filter(
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

describe("GET /seasons/:id", () => {
  let createdSeason: Season;

  beforeAll(async () => {
    await prisma.season.deleteMany({});
    createdSeason = await prisma.season.create({ data: mockSeasons[0] });
  });

  it("should return season given valid id", async () => {
    const id = createdSeason.id;
    const res: SeasonResponse = await auth().get(`/seasons/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdSeason) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/seasons/badId");

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

  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth().get("/seasons/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Season not found");
  });
});

describe("POST /seasons", () => {
  beforeAll(async () => {
    await prisma.season.deleteMany({});
  });

  it("should create season successfully given name", async () => {
    const res: SeasonResponse = await auth()
      .post("/seasons")
      .send({
        ...mockSeasons[0],
        startDate: mockSeasons[0].startDate.toISOString().slice(0, 10),
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(json({ data: mockSeasons[0] }));
  });

  it("should fail given invalid name", async () => {
    const res: ErrorResponse = await auth()
      .post("/seasons")
      .send({ name: "sh" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "Name is too short",
        path: ["name"],
      },
    ]);
  });
});

describe("PATCH /seasons/:id", () => {
  let createdSeason: Season;
  beforeAll(async () => {
    await prisma.season.deleteMany({});
    createdSeason = await prisma.season.create({ data: mockSeasons[0] });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdSeason.id;
    const res: SeasonResponse = await auth()
      .patch(`/seasons/${id}`)
      .send({ name: mockSeasons[1].name });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdSeason,
          name: mockSeasons[1].name,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/seasons/badId")
      .send({ name: mockSeasons[1].name });

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
  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/seasons/99999999")
      .send({ name: mockSeasons[1].name });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Season not found");
  });
  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/seasons/${createdSeason.id}`)
      .send({ name: "sh" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "Name is too short",
        path: ["name"],
      },
    ]);
  });
});

describe("DELETE /seasons/:id", () => {
  let createdSeason: Season;

  beforeAll(async () => {
    await prisma.season.deleteMany({});
    createdSeason = await prisma.season.create({ data: mockSeasons[0] });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdSeason.id;
    const res: SeasonResponse = await auth().delete(`/seasons/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdSeason) });

    const res2: ErrorResponse = await auth().get(`/seasons/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Season not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/seasons/badId");

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

  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/seasons/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Season not found");
  });
});

afterAll(async () => {
  await prisma.season.deleteMany({});
  await prisma.$disconnect();
});
