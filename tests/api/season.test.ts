import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve("config", ".env.dev") });

import { afterAll, beforeAll, describe, expect, it } from "@jest/globals";
import { Season } from "../../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../../src/utils/types/response.types";
import {
  auth,
  cleanDatabase,
  json,
  login,
  MockData,
  populateDatabase,
} from "../utils";
import prisma from "../../src/db/prisma";

type SeasonResponse = DataResponse<Season>;
type PaginatedSeasonsResponse = PaginationResponse<Season[]>;

let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /seasons", () => {
  it("should return all seasons", async () => {
    const seasons = [...seed.seasons].sort((a, b) => a.id - b.id);

    const res: PaginatedSeasonsResponse = await auth().get("/seasons");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seasons,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seasons.length / 20),
        totalCount: seasons.length,
      }),
    );
  });

  it("should return paginated seasons given page and size", async () => {
    const page = 2;
    const size = 2;
    const seasons = [...seed.seasons].sort((a, b) => a.id - b.id);
    const paginated = seasons.slice((page - 1) * size, page * size);

    const res: PaginatedSeasonsResponse = await auth().get(
      `/seasons?page=${page}&size=${size}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: paginated,
        page,
        size,
        totalPages: Math.ceil(seasons.length / size),
        totalCount: seasons.length,
      }),
    );
  });

  it("should return all seasons that relate to queried name", async () => {
    const seasonName = seed.seasons.find((season) => season.name)?.name;

    expect(seasonName).toBeTruthy();

    const res: PaginatedSeasonsResponse = await auth().get(
      `/seasons?name=${encodeURIComponent(seasonName!)}`,
    );

    const filtered = [...seed.seasons]
      .filter((season) => season.name === seasonName)
      .sort((a, b) => a.id - b.id);

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
  it("should return all seasons between startDate and endDate", async () => {
    const start = seed.seasons[0].startDate;
    const end = seed.seasons[2].endDate!;

    const res: PaginatedSeasonsResponse = await auth().get(
      `/seasons?startDate=${encodeURIComponent(start.toISOString().slice(0, 10))}&endDate=${encodeURIComponent(end.toISOString().slice(0, 10))}`,
    );
    const filtered = seed.seasons.filter(
      (s) => s.startDate >= start && s.endDate! <= end,
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
  it("should return all seasons sorted according to sortBy and order", async () => {
    const res: PaginatedSeasonsResponse = await auth().get(
      "/seasons?sortBy=startDate&order=desc",
    );

    const sorted = [...seed.seasons].sort(
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


});

describe("GET /seasons/:id", () => {
  it("should return season given valid id", async () => {
    const season = seed.seasons[0];

    const res: SeasonResponse = await auth().get(`/seasons/${season.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(season) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/seasons/badId");

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

  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth().get("/seasons/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Season not found");
  });
});

describe("POST /seasons", () => {
  it("should create season successfully given valid data", async () => {
    const body = {
      name: "Season created by test",
      startDate: "2098-04-01",
    };

    const res: SeasonResponse = await auth().post("/seasons").send(body);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({
        data: {
          name: body.name,
          startDate: new Date(body.startDate),
        },
      }),
    );
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
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const season = seed.seasons[0];
    const newName = "Updated season test";

    const res: SeasonResponse = await auth()
      .patch(`/seasons/${season.id}`)
      .send({ name: newName });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...season,
          name: newName,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/seasons/badId")
      .send({ name: "Updated season test" });

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

  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/seasons/99999999")
      .send({ name: "Updated season test" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Season not found");
  });

  it("should fail given invalid data", async () => {
    const season = seed.seasons[0];

    const res: ErrorResponse = await auth()
      .patch(`/seasons/${season.id}`)
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
  it("should delete successfully given valid id", async () => {
    const season = seed.seasons[3];
    const res: SeasonResponse = await auth().delete(`/seasons/${season.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(season) });

    const res2: ErrorResponse = await auth().get(`/seasons/${season.id}`);

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
        message: "value can only be a positive integer",
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
  await cleanDatabase();
  await prisma.$disconnect();
});
