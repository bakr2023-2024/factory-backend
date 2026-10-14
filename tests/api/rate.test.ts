import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { PaymentType, Rate } from "../../src/db/generated/prisma/client";
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

type RateResponse = DataResponse<Rate>;
type PaginatedRatesResponse = PaginationResponse<Rate[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /rates", () => {
  it("should  all rate", async () => {
    const res: PaginatedRatesResponse = await auth().get("/rates");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.rates,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.rates.length / 20),
        totalCount: seed.rates.length,
      }),
    );
  });

  it("should  paginated rate given page and size", async () => {
    const res: PaginatedRatesResponse = await auth().get(
      "/rates?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.rates.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.rates.length / 2),
        totalCount: seed.rates.length,
      }),
    );
  });

  it("should  all rate given laborerId", async () => {
    const laborerId = seed.laborers[1].id;
    const res: PaginatedRatesResponse = await auth().get(
      `/rates?laborerId=${laborerId}`,
    );
    const filtered = seed.rates.filter((r) => r.laborerId === laborerId);

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

  it("should  all rate given laborerName", async () => {
    const laborerName = seed.laborers[0].name;
    const res: PaginatedRatesResponse = await auth().get(
      `/rates?laborerName=${encodeURIComponent(laborerName)}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.name === laborerName)
      .map((c) => c.id);
    const filtered = seed.rates.filter((r) => laborerIds.includes(r.laborerId));

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

  it("should  all rate given laborerNumber", async () => {
    const laborerNumber = seed.laborers[1].number!;
    const res: PaginatedRatesResponse = await auth().get(
      `/rates?laborerNumber=${laborerNumber}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.number === laborerNumber)
      .map((c) => c.id);
    const filtered = seed.rates.filter((r) => laborerIds.includes(r.laborerId));

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
  it("should  all rate given seasonId", async () => {
    const seasonId = seed.seasons[0].id;
    const res: PaginatedRatesResponse = await auth().get(
      `/rates?seasonId=${seasonId}`,
    );
    const filtered = seed.rates.filter((c) => c.seasonId === seasonId);
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
  it("should  all rate given minSalary and maxSalary", async () => {
    const minSalary = seed.rates[0].dailySalary.toNumber();
    const maxSalary = seed.rates[1].dailySalary.toNumber();
    const res: PaginatedRatesResponse = await auth().get(
      `/rates?minSalary=${minSalary}&maxSalary=${maxSalary}`,
    );
    const filtered = seed.rates.filter(
      (c) =>
        c.dailySalary.toNumber() >= minSalary &&
        c.dailySalary.toNumber() <= maxSalary,
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
  it("should  all rate given from", async () => {
    const from = seed.rates[0].from.toISOString().slice(0, 10);
    const res: PaginatedRatesResponse = await auth().get(`/rates?from=${from}`);
    const filtered = seed.rates.filter(
      (r) => r.from.toISOString().slice(0, 10) >= from,
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
  it("should return all rates given paymentType", async () => {
    const paymentType = PaymentType.WEEKLY;
    const res: PaginatedRatesResponse = await auth().get(
      `/rates?paymentType=${paymentType}`,
    );
    const filtered = seed.rates.filter((c) => c.paymentType === paymentType);
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
  it("should return all rate sorted according to sortBy and order", async () => {
    const res: PaginatedRatesResponse = await auth().get(
      "/rates?sortBy=from&order=desc",
    );
    const sorted = seed.rates.toSorted(
      (a, b) => b.from.getTime() - a.from.getTime(),
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

describe("GET /rates/:id", () => {
  it("should  laborer  given valid id", async () => {
    const rate = seed.rates[0];
    const res: RateResponse = await auth().get(`/rates/${rate.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(rate) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/rates/badId");

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

  it("should fail if laborer  isn't found", async () => {
    const res: ErrorResponse = await auth().get("/rates/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Rate not found");
  });
});

describe("POST /rates", () => {
  it("should create laborer successfully given valid data", async () => {
    const payload = {
      laborerId: seed.laborers[0].id,
      seasonId: seed.seasons[0].id,
      from: "2098-04-01",
      dailySalary: 200,
      paymentType: PaymentType.WEEKLY,
    };
    const res: RateResponse = await auth().post("/rates").send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({ data: { ...payload, from: new Date(payload.from) } }),
    );
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/rates").send({
      dailySalary: 200,
      paymentType: PaymentType.WEEKLY,
      laborerId: -1,
      seasonId: -1,
      from: "baddate",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["laborerId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["seasonId"],
      },
      {
        key: "body",
        message: "Invalid Date",
        path: ["from"],
      },
    ]);
  });

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth().post("/rates").send({
      dailySalary: 200,
      paymentType: PaymentType.WEEKLY,
      laborerId: 99999999,
      seasonId: seed.seasons[2].id,
      from: "2098-04-01",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth().post("/rates").send({
      dailySalary: 200,
      paymentType: PaymentType.WEEKLY,
      seasonId: 99999999,
      laborerId: seed.laborers[2].id,
      from: "2098-04-01",
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
});

describe("PATCH /rates/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const rate = seed.rates[0];
    const res: RateResponse = await auth()
      .patch(`/rates/${rate.id}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...rate, notes: "Updated notes" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/rates/badId")
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

  it("should fail if rate isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/rates/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Rate not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/rates/${seed.rates[0].id}`)
      .send({ laborerId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["laborerId"],
      },
    ]);
  });

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/rates/${seed.rates[0].id}`)
      .send({ laborerId: 99999999 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/rates/${seed.rates[0].id}`)
      .send({ seasonId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
});

describe("DELETE /rates/:id", () => {
  let createdRate: Rate;

  beforeAll(async () => {
    createdRate = await prisma.rate.create({
      data: {
        laborerId: seed.laborers[0].id,
        seasonId: seed.seasons[0].id,
        from: seed.rates[0].from,
        dailySalary: 200,
        paymentType: PaymentType.WEEKLY,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdRate.id;
    const res: RateResponse = await auth().delete(`/rates/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdRate) });

    const res2: ErrorResponse = await auth().get(`/rates/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Rate not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/rates/badId");

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

  it("should fail if rate isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/rates/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Rate not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
