import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Laborer } from "../../src/db/generated/prisma/client";
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

type LaborerResponse = DataResponse<Laborer>;
type PaginatedLaborersResponse = PaginationResponse<Laborer[]>;
const newLaborer = { name: "new laborer", number: "01234567890" };
let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /laborers", () => {
  it("should return all laborers", async () => {
    const res: PaginatedLaborersResponse = await auth().get("/laborers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.laborers,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.laborers.length / 20),
        totalCount: seed.laborers.length,
      }),
    );
  });

  it("should return paginated laborers given page and size", async () => {
    const res: PaginatedLaborersResponse = await auth().get(
      "/laborers?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.laborers.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.laborers.length / 2),
        totalCount: seed.laborers.length,
      }),
    );
  });

  it("should return all laborers that relate to queried name", async () => {
    const laborer = seed.laborers[2];

    const res: PaginatedLaborersResponse = await auth().get(
      `/laborers?name=${encodeURIComponent(laborer.name)}`,
    );

    const filtered = seed.laborers.filter((s) => s.name === laborer.name);

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

  it("should return all laborers that relate to queried number", async () => {
    const laborer = seed.laborers[2];

    const res: PaginatedLaborersResponse = await auth().get(
      `/laborers?number=${laborer.number}`,
    );

    const filtered = seed.laborers.filter((s) => s.number === laborer.number);

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

  it("should return all laborers sorted according to sortBy and order", async () => {
    const res: PaginatedLaborersResponse = await auth().get(
      "/laborers?sortBy=name&order=desc",
    );

    const sorted = seed.laborers.toSorted((a, b) =>
      b.name.localeCompare(a.name),
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

describe("GET /laborers/:id", () => {
  it("should return laborer given valid id", async () => {
    const laborer = seed.laborers[0];

    const res: LaborerResponse = await auth().get(`/laborers/${laborer.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(laborer) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/laborers/badId");

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

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth().get("/laborers/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Laborer not found");
  });
});

describe("POST /laborers", () => {
  it("should create laborer successfully given name and number", async () => {
    const payload = {
      name: "new laborer",
      number: "01234567890",
    };

    const res: LaborerResponse = await auth().post("/laborers").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid name or invalid number", async () => {
    const res: ErrorResponse = await auth()
      .post("/laborers")
      .send({ name: "sh", number: "07" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "Name is too short",
        path: ["name"],
      },
      {
        key: "body",
        message: "Number is too short",
        path: ["number"],
      },
    ]);
  });
});

describe("PATCH /laborers/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const laborer = seed.laborers[0];

    const res: LaborerResponse = await auth()
      .patch(`/laborers/${laborer.id}`)
      .send({ name: "updated laborer" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...laborer,
          name: "updated laborer",
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/laborers/badId")
      .send({ name: "updated laborer" });

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

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/laborers/99999999")
      .send({ name: "updated laborer" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Laborer not found");
  });

  it("should fail given invalid name or invalid number", async () => {
    const laborer = seed.laborers[0];

    const res: ErrorResponse = await auth()
      .patch(`/laborers/${laborer.id}`)
      .send({ name: "sh", number: "07" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "Name is too short",
        path: ["name"],
      },
      {
        key: "body",
        message: "Number is too short",
        path: ["number"],
      },
    ]);
  });
});

describe("DELETE /laborers/:id", () => {
  let createdLaborer:Laborer;
  beforeAll(async()=>{
    createdLaborer = await prisma.laborer.create({data:newLaborer})
  })
  it("should delete successfully given valid id", async () => {
    const id = createdLaborer.id
    const res: LaborerResponse = await auth().delete(
      `/laborers/${id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdLaborer) });

    const res2: ErrorResponse = await auth().get(`/laborers/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Laborer not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/laborers/badId");

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

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/laborers/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Laborer not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
