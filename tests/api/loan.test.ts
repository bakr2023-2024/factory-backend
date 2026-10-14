import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Loan } from "../../src/db/generated/prisma/client";
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

type LoanResponse = DataResponse<Loan>;
type PaginatedLoansResponse = PaginationResponse<Loan[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /loans", () => {
  it("should return all loan", async () => {
    const res: PaginatedLoansResponse = await auth().get("/loans");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.loans,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.loans.length / 20),
        totalCount: seed.loans.length,
      }),
    );
  });

  it("should return paginated loan given page and size", async () => {
    const res: PaginatedLoansResponse = await auth().get(
      "/loans?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.loans.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.loans.length / 2),
        totalCount: seed.loans.length,
      }),
    );
  });

  it("should return all loan given laborerId", async () => {
    const laborerId = seed.laborers[1].id;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?laborerId=${laborerId}`,
    );
    const filtered = seed.loans.filter((r) => r.laborerId === laborerId);

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

  it("should return all loan given laborerName", async () => {
    const laborerName = seed.laborers[0].name;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?laborerName=${encodeURIComponent(laborerName)}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.name === laborerName)
      .map((c) => c.id);
    const filtered = seed.loans.filter((r) => laborerIds.includes(r.laborerId));

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

  it("should return all loan given laborerNumber", async () => {
    const laborerNumber = seed.laborers[1].number!;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?laborerNumber=${laborerNumber}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.number === laborerNumber)
      .map((c) => c.id);
    const filtered = seed.loans.filter((r) => laborerIds.includes(r.laborerId));

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
  it("should return all loan given seasonId", async () => {
    const seasonId = seed.seasons[0].id;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?seasonId=${seasonId}`,
    );
    const filtered = seed.loans.filter((c) => c.seasonId === seasonId);
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
  it("should return all loan given loanAmount", async () => {
    const loanAmount = seed.loans[0].loanAmount;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?loanAmount=${loanAmount}`,
    );
    const filtered = seed.loans.filter((c) => c.loanAmount == loanAmount);

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
  it("should return all loan given loanedAt", async () => {
    const loanedAt = seed.loans[0].loanedAt;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?loanedAt=${encodeURIComponent(loanedAt.toISOString())}`,
    );
    const filtered = seed.loans.filter((r) => r.loanedAt >= loanedAt);

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

  it("should return all loan given paymentId", async () => {
    const paymentId = seed.payments[0].id;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?paymentId=${paymentId}`,
    );
    const filtered = seed.loans.filter((r) => r.paymentId == paymentId);

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

  it("should return all loan sorted according to sortBy and order", async () => {
    const res: PaginatedLoansResponse = await auth().get(
      "/loans?sortBy=loanedAt&order=desc",
    );
    const sorted = seed.loans.toSorted(
      (a, b) => b.loanedAt.getTime() - a.loanedAt.getTime(),
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

describe("GET /loans/:id", () => {
  it("should return loan given valid id", async () => {
    const loan = seed.loans[0];
    const res: LoanResponse = await auth().get(`/loans/${loan.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(loan) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/loans/badId");

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

  it("should fail if loan isn't found", async () => {
    const res: ErrorResponse = await auth().get("/loans/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Loan not found");
  });
});

describe("POST /loans", () => {
  it("should create loan successfully given valid data", async () => {
    const payload = {
      laborerId: seed.laborers[0].id,
      seasonId: seed.seasons[2].id,
      loanAmount: 300,
    };
    const res: LoanResponse = await auth().post("/loans").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      laborerId: -1,
      seasonId: -1,
      loanAmount: 300,
      loanedAt: "bad date",
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
        message: "Invalid DateTime",
        path: ["loanedAt"],
      },
    ]);
  });

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      laborerId: 99999999,
      seasonId: seed.seasons[2].id,
      loanAmount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      laborerId: seed.laborers[0].id,
      seasonId: 99999999,
      loanAmount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
});

describe("PATCH /loans/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const loan = seed.loans[0];
    const res: LoanResponse = await auth()
      .patch(`/loans/${loan.id}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...loan, notes: "Updated notes" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/loans/badId")
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

  it("should fail if loan isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/loans/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Loan not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loans/${seed.loans[0].id}`)
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
      .patch(`/loans/${seed.loans[0].id}`)
      .send({ laborerId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
  it("should fail if season isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loans/${seed.loans[0].id}`)
      .send({ seasonId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No laborer/season exists with that ID");
  });
});

describe("DELETE /loans/:id", () => {
  let createdLoan: Loan;

  beforeAll(async () => {
    createdLoan = await prisma.loan.create({
      data: {
        laborerId: seed.laborers[0].id,
        seasonId: seed.seasons[1].id,
        loanAmount: 300,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdLoan.id;
    const res: LoanResponse = await auth().delete(`/loans/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdLoan) });

    const res2: ErrorResponse = await auth().get(`/loans/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Loan not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/loans/badId");

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

  it("should fail if loan isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/loans/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Loan not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
