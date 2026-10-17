import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { LoanPayment } from "../../src/db/generated/prisma/client";
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

type LoanPaymentResponse = DataResponse<LoanPayment>;
type PaginatedLoanPaymentsResponse = PaginationResponse<LoanPayment[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /loanPayments", () => {
  it("should return all loanPayment", async () => {
    const res: PaginatedLoanPaymentsResponse =
      await auth().get("/loanPayments");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.loanPayments,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.loanPayments.length / 20),
        totalCount: seed.loanPayments.length,
      }),
    );
  });

  it("should return paginated loanPayment given page and size", async () => {
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      "/loanPayments?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.loanPayments.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.loanPayments.length / 2),
        totalCount: seed.loanPayments.length,
      }),
    );
  });

  it("should return all loanPayment given rateId", async () => {
    const rateId = seed.loans[1].id;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?rateId=${rateId}`,
    );
    const filtered = seed.loanPayments.filter((r) => r.rateId === rateId);

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
  it("should return all loanPayment given laborerId", async () => {
    const laborerId = seed.laborers[0].id;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?laborerId=${laborerId}`,
    );
    const rateIds = seed.rates
      .filter((r) => r.laborerId == laborerId)
      .map((r) => r.id);
    const filtered = seed.loanPayments.filter((r) =>
      rateIds.includes(r.rateId),
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
  it("should return all loanPayment given laborerName", async () => {
    const laborerName = seed.laborers[0].name;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?laborerName=${encodeURIComponent(laborerName)}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.name === laborerName)
      .map((c) => c.id);
    const rateIds = seed.rates
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.loanPayments.filter((r) =>
      rateIds.includes(r.rateId),
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
  it("should return all loanPayment given laborerNumber", async () => {
    const laborerNumber = seed.laborers[0].number || "07775000";
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?laborerNumber=${encodeURIComponent(laborerNumber)}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.number === laborerNumber)
      .map((c) => c.id);
    const rateIds = seed.rates
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.loanPayments.filter((r) =>
      rateIds.includes(r.rateId),
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
  it("should return all loanPayment given minAmount and maxAmount", async () => {
    const minAmount = seed.loans[0].amount;
    const maxAmount = seed.loans[2].amount;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?minAmount=${minAmount}&maxAmount=${maxAmount}`,
    );
    const filtered = seed.loanPayments.filter(
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
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?productionDayId=${productionDayId}`,
    );
    const filtered = seed.loanPayments.filter(
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
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.loanPayments.filter((c) =>
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
  it("should return all loanPayment given occurredFrom and occurredTo", async () => {
    const occurredFrom = seed.loanPayments[0].occurredAt;
    const occurredTo = seed.loanPayments[2].occurredAt;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.loanPayments.filter(
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

  it("should return all loanPayment sorted according to sortBy and order", async () => {
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      "/loanPayments?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.loanPayments.toSorted(
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

describe("GET /loanPayments/:id", () => {
  it("should return loanPayment given valid id", async () => {
    const loanPayment = seed.loanPayments[0];
    const res: LoanPaymentResponse = await auth().get(
      `/loanPayments/${loanPayment.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(loanPayment) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/loanPayments/badId");

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

  it("should fail if loanPayment isn't found", async () => {
    const res: ErrorResponse = await auth().get("/loanPayments/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("LoanPayment not found");
  });
});

describe("POST /loanPayments", () => {
  it("should create loanPayment successfully given valid data", async () => {
    const payload = {
      rateId: seed.rates[1].id,
      productionDayId: seed.productionDays[0].id,
      amount: 300,
    };
    const res: LoanPaymentResponse = await auth()
      .post("/loanPayments")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/loanPayments").send({
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
    const res: ErrorResponse = await auth().post("/loanPayments").send({
      rateId: 99999999,
      productionDayId: seed.productionDays[0].id,
      amount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/loanPayments").send({
      rateId: seed.rates[1].id,
      productionDayId: 99999999,
      amount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth().post(`/loanPayments`).send({
      amount: 300,
      rateId: seed.rates[0].id,
      productionDayId: seed.productionDays[0].id,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "can't change attendance, loan, loanPayment or payment of a paid rate",
    );
  });
});

describe("PATCH /loanPayments/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const loanPayment = seed.loanPayments[2];
    const res: LoanPaymentResponse = await auth()
      .patch(`/loanPayments/${loanPayment.id}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...loanPayment, notes: "Updated notes" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/loanPayments/badId")
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

  it("should fail if loanPayment isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/loanPayments/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("LoanPayment not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loanPayments/${seed.loanPayments[2].id}`)
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
      .patch(`/loanPayments/${seed.loanPayments[2].id}`)
      .send({ rateId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if current rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loanPayments/${seed.loanPayments[0].id}`)
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
      .patch(`/loanPayments/${seed.loanPayments[2].id}`)
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

describe("DELETE /loanPayments/:id", () => {
  it("should delete successfully given valid id", async () => {
    const loanPayment = seed.loanPayments[3];
    const res: LoanPaymentResponse = await auth().delete(
      `/loanPayments/${loanPayment.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(loanPayment) });

    const res2: ErrorResponse = await auth().get(
      `/loanPayments/${loanPayment.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("LoanPayment not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/loanPayments/badId");

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

  it("should fail if loanPayment isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/loanPayments/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("LoanPayment not found");
  });
  it("should fail if current rateId belongs to a paid rate", async () => {
    const res: ErrorResponse = await auth().delete(
      `/loanPayments/${seed.loanPayments[0].id}`,
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
