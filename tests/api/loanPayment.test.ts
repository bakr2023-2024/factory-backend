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

  it("should return all loanPayment given loanId", async () => {
    const loanId = seed.loans[1].id;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?loanId=${loanId}`,
    );
    const filtered = seed.loanPayments.filter((r) => r.loanId === loanId);

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
    const laborerId = seed.loans[1].laborerId;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?laborerId=${laborerId}`,
    );
    const loanIds = seed.loans
      .filter((r) => r.laborerId == laborerId)
      .map((r) => r.id);
    const filtered = seed.loanPayments.filter((r) =>
      loanIds.includes(r.loanId),
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
      .filter((r) => r.name.includes(laborerName))
      .map((r) => r.id);
    const loanIds = seed.loans
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.loanPayments.filter((r) =>
      loanIds.includes(r.loanId),
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
      .filter((r) => r.number && r.number.includes(laborerNumber))
      .map((r) => r.id);
    const loanIds = seed.loans
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.loanPayments.filter((r) =>
      loanIds.includes(r.loanId),
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
  it("should return all loanPayment given amount", async () => {
    const amount = seed.loanPayments[0].amount;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?amount=${amount}`,
    );
    const filtered = seed.loanPayments.filter((c) => c.amount === amount);
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
  it("should return all loanPayment given repaidAt", async () => {
    const repaidAt = seed.loanPayments[0].repaidAt;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?repaidAt=${encodeURIComponent(repaidAt.toISOString())}`,
    );
    const filtered = seed.loanPayments.filter((r) => r.repaidAt >= repaidAt);

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
  it("should return all loanPayment given paymentId", async () => {
    const paymentId = seed.payments[0].id;
    const res: PaginatedLoanPaymentsResponse = await auth().get(
      `/loanPayments?paymentId=${paymentId}`,
    );
    const filtered = seed.loanPayments.filter((r) => r.paymentId === paymentId);

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
      "/loanPayments?sortBy=repaidAt&order=desc",
    );
    const sorted = seed.loanPayments.toSorted(
      (a, b) => b.repaidAt.getTime() - a.repaidAt.getTime(),
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
      loanId: seed.loans[0].id,
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
      loanId: -1,
      amount: -300,
      repaidAt: "bad date",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["loanId"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["amount"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["repaidAt"],
      },
    ]);
  });

  it("should fail if loan isn't found", async () => {
    const res: ErrorResponse = await auth().post("/loanPayments").send({
      loanId: 99999999,
      amount: 300,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No loan exists with that ID");
  });
});

describe("PATCH /loanPayments/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const loanPayment = seed.loanPayments[0];
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
      .patch(`/loanPayments/${seed.loanPayments[0].id}`)
      .send({ loanId: -1, amount: -300 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["loanId"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["amount"],
      },
    ]);
  });

  it("should fail if loan isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/loanPayments/${seed.loanPayments[0].id}`)
      .send({ loanId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No loan exists with that ID");
  });
});

describe("DELETE /loanPayments/:id", () => {
  let createdLoanPayment: LoanPayment;

  beforeAll(async () => {
    createdLoanPayment = await prisma.loanPayment.create({
      data: {
        loanId: seed.loans[0].id,
        amount: 300,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdLoanPayment.id;
    const res: LoanPaymentResponse = await auth().delete(`/loanPayments/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdLoanPayment) });

    const res2: ErrorResponse = await auth().get(`/loanPayments/${id}`);

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
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
