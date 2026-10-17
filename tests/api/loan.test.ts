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

  it("should return all loan given rateId", async () => {
    const rateId = seed.rates[1].id;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?rateId=${rateId}`,
    );
    const filtered = seed.loans.filter((r) => r.rateId === rateId);

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
    const rateIds = seed.rates
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.loans.filter((r) => rateIds.includes(r.rateId));
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
    const laborerNumber = seed.laborers[1].number || "07775000";
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?laborerNumber=${laborerNumber}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.number === laborerNumber)
      .map((c) => c.id);
    const rateIds = seed.rates
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.loans.filter((r) => rateIds.includes(r.rateId));
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
  it("should return all loan given minAmount and maxAmount", async () => {
    const minAmount = seed.loans[0].amount;
    const maxAmount = seed.loans[2].amount;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?minAmount=${minAmount}&maxAmount=${maxAmount}`,
    );
    const filtered = seed.loans.filter(
      (c) => c.amount >= minAmount && c.amount <= maxAmount,
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
  it("should return all exports given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?productionDayId=${productionDayId}`,
    );
    const filtered = seed.loans.filter(
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
  it("should return all exports given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.loans.filter((c) =>
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
  it("should return all loan given occurredFrom and occurredTo", async () => {
    const occurredFrom = seed.loans[0].occurredAt;
    const occurredTo = seed.loans[2].occurredAt;
    const res: PaginatedLoansResponse = await auth().get(
      `/loans?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.loans.filter(
      (r) => r.occurredAt >= occurredFrom && r.occurredAt <= occurredTo,
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

  it("should return all loan sorted according to sortBy and order", async () => {
    const res: PaginatedLoansResponse = await auth().get(
      "/loans?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.loans.toSorted(
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
        message: "value can only be a positive integer",
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
      rateId: seed.rates[1].id,
      productionDayId: seed.productionDays[0].id,
      amount: 300,
    };
    const res: LoanResponse = await auth().post("/loans").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      rateId: -1,
      productionDayId: -1,
      amount: -300,
      occurredAt: "bad date",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["rateId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["amount"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
    ]);
  });

  it("should fail if rate isn't found", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      rateId: 99999999,
      productionDayId: seed.productionDays[0].id,
      amount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      rateId: seed.rates[1].id,
      productionDayId: 99999999,
      amount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth().post("/loans").send({
      rateId: seed.rates[2].id,
      productionDayId: seed.productionDays[0].id,
      amount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "can't change attendance, loan, loanPayment or payment of a paid rate",
    );
  });
});

describe("PATCH /loans/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const loan = seed.loans[2];
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
        message: "value can only be a positive integer",
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
      .patch(`/loans/${seed.loans[2].id}`)
      .send({ rateId: -1, productionDayId: -1, amount: -300 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["rateId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["amount"],
      },
    ]);
  });

  it("should fail if rate isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loans/${seed.loans[2].id}`)
      .send({ rateId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if current rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loans/${seed.loans[0].id}`)
      .send({
        amount: 300,
        rateId: seed.rates[1].id,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "can't change attendance, loan, loanPayment or payment of a paid rate",
    );
  });
  it("should fail if new rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loans/${seed.loans[2].id}`)
      .send({
        amount: 300,
        rateId: seed.rates[0].id,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "can't relate attendance, loan, loanPayment or payment to a paid rate",
    );
  });
});

describe("DELETE /loans/:id", () => {
  it("should delete successfully given valid id", async () => {
    const res: LoanResponse = await auth().delete(`/loans/${seed.loans[3].id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(seed.loans[3]) });

    const res2: ErrorResponse = await auth().get(`/loans/${seed.loans[3].id}`);

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
        message: "value can only be a positive integer",
        path: ["id"],
      },
    ]);
  });

  it("should fail if loan isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/loans/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Loan not found");
  });
  it("should fail if current rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth().delete(
      `/loans/${seed.loans[0].id}`,
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "can't change attendance, loan, loanPayment or payment of a paid rate",
    );
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
