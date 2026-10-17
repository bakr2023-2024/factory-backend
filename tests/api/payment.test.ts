import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Payment } from "../../src/db/generated/prisma/client";
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

type PaymentResponse = DataResponse<Payment>;
type PaginatedPaymentsResponse = PaginationResponse<Payment[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /payments", () => {
  it("should return all payment", async () => {
    const res: PaginatedPaymentsResponse = await auth().get("/payments");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.payments,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.payments.length / 20),
        totalCount: seed.payments.length,
      }),
    );
  });

  it("should return paginated payment given page and size", async () => {
    const res: PaginatedPaymentsResponse = await auth().get(
      "/payments?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.payments.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.payments.length / 2),
        totalCount: seed.payments.length,
      }),
    );
  });

  it("should return all payment given rateId", async () => {
    const rateId = seed.rates[1].id;
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?rateId=${rateId}`,
    );
    const filtered = seed.payments.filter((r) => r.rateId === rateId);

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
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?productionDayId=${productionDayId}`,
    );
    const filtered = seed.payments.filter(
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
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.payments.filter((c) =>
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
  it("should return all payment given laborerName", async () => {
    const laborerName = seed.laborers[0].name;
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?laborerName=${encodeURIComponent(laborerName)}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.name === laborerName)
      .map((c) => c.id);
    const rateIds = seed.rates
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.payments.filter((r) => rateIds.includes(r.rateId));

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

  it("should return all payment given laborerNumber", async () => {
    const laborerNumber = seed.laborers[1].number || "07775000";
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?laborerNumber=${laborerNumber}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.number === laborerNumber)
      .map((c) => c.id);
    const rateIds = seed.rates
      .filter((r) => laborerIds.includes(r.laborerId))
      .map((r) => r.id);
    const filtered = seed.payments.filter((r) => rateIds.includes(r.rateId));
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
  it("should return all payment given occurredFrom", async () => {
    const occurredFrom = new Date(
      seed.payments[0].occurredAt.getTime() + 3600000,
    );
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}`,
    );
    const filtered = seed.payments.filter((r) => r.occurredAt >= occurredFrom);

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

  it("should return all payment given occurredTo", async () => {
    const occurredTo = new Date(
      seed.payments[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.payments.filter((r) => r.occurredAt <= occurredTo);

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

  it("should return all payment given occurredFrom and occurredTo", async () => {
    const occurredFrom = new Date(
      seed.payments[0].occurredAt.getTime() + 3600000,
    );
    const occurredTo = new Date(
      seed.payments[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedPaymentsResponse = await auth().get(
      `/payments?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.payments.filter(
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

  it("should return all payment sorted according to sortBy and order", async () => {
    const res: PaginatedPaymentsResponse = await auth().get(
      "/payments?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.payments.toSorted(
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

describe("GET /payments/:id", () => {
  it("should return rate return given valid id", async () => {
    const payment = seed.payments[0];
    const res: PaymentResponse = await auth().get(`/payments/${payment.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(payment) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/payments/badId");

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

  it("should fail if rate return isn't found", async () => {
    const res: ErrorResponse = await auth().get("/payments/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payment not found");
  });
});

describe("POST /payments", () => {
  it("should create payment successfully given valid data", async () => {
    const payload = {
      rateId: seed.rates[1].id,
      productionDayId: seed.productionDays[0].id,
      gross: 600,
      loans: 200,
      loanPayments: 100,
      net: 600 - 200 + 100,
    };
    const res: PaymentResponse = await auth().post("/payments").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/payments").send({
      rateId: -1,
      productionDayId: -1,
      gross: -1,
      loans: -1,
      loanPayments: -1,
      net: -1,
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
        path: ["gross"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["loans"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["loanPayments"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["net"],
      },
    ]);
  });

  it("should fail if rate isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/payments")
      .send({
        rateId: 99999999,
        productionDayId: seed.productionDays[0].id,
        gross: 600,
        loans: 200,
        loanPayments: 100,
        net: 600 - 200 + 100,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/payments")
      .send({
        rateId: seed.rates[3].id,
        productionDayId: 99999999,
        gross: 600,
        loans: 200,
        loanPayments: 100,
        net: 600 - 200 + 100,
      });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No rate/productionDay exists with that ID");
  });
});

describe("DELETE /payments/:id", () => {
  it("should delete successfully given valid id", async () => {
    const createdPayment = seed.payments[2];
    const id = createdPayment.id;
    const res: PaymentResponse = await auth().delete(`/payments/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdPayment) });

    const res2: ErrorResponse = await auth().get(`/payments/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Payment not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/payments/badId");

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

  it("should fail if rate return isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/payments/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Payment not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
