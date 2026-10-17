import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Expense, ExpenseType } from "../../src/db/generated/prisma/client";
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

type ExpenseResponse = DataResponse<Expense>;
type PaginatedExpensesResponse = PaginationResponse<Expense[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /expenses", () => {
  it("should return all expense", async () => {
    const res: PaginatedExpensesResponse = await auth().get("/expenses");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.expenses,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.expenses.length / 20),
        totalCount: seed.expenses.length,
      }),
    );
  });

  it("should return paginated expense given page and size", async () => {
    const res: PaginatedExpensesResponse = await auth().get(
      "/expenses?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.expenses.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.expenses.length / 2),
        totalCount: seed.expenses.length,
      }),
    );
  });

  it("should return all expense given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedExpensesResponse = await auth().get(
      `/expenses?productionDayId=${productionDayId}`,
    );
    const filtered = seed.expenses.filter(
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
  it("should return all expense given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedExpensesResponse = await auth().get(
      `/expenses?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.expenses.filter((c) =>
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
  it("should return all expense given occurredFrom", async () => {
    const occurredFrom = new Date(
      seed.expenses[0].occurredAt.getTime() + 3600000,
    );
    const res: PaginatedExpensesResponse = await auth().get(
      `/expenses?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}`,
    );
    const filtered = seed.expenses.filter((r) => r.occurredAt >= occurredFrom);

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

  it("should return all expense given occurredTo", async () => {
    const occurredTo = new Date(
      seed.expenses[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedExpensesResponse = await auth().get(
      `/expenses?occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.expenses.filter((r) => r.occurredAt <= occurredTo);

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

  it("should return all expense given occurredFrom and occurredTo", async () => {
    const occurredFrom = new Date(
      seed.expenses[0].occurredAt.getTime() + 3600000,
    );
    const occurredTo = new Date(
      seed.expenses[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedExpensesResponse = await auth().get(
      `/expenses?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.expenses.filter(
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

  it("should return all expense sorted according to sortBy and order", async () => {
    const res: PaginatedExpensesResponse = await auth().get(
      "/expenses?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.expenses.toSorted(
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

describe("GET /expenses/:id", () => {
  it("should return  expense given valid id", async () => {
    const expense = seed.expenses[0];
    const res: ExpenseResponse = await auth().get(`/expenses/${expense.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(expense) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/expenses/badId");

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

  it("should fail if expense isn't found", async () => {
    const res: ErrorResponse = await auth().get("/expenses/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Expense not found");
  });
});

describe("POST /expenses", () => {
  it("should create expense successfully given valid data", async () => {
    const payload = {
      productionDayId: seed.productionDays[2].id,
      amount: 300,
      occurredAt: "2026-10-10T09:00:00.000Z",
      type: ExpenseType.SUNDRIES,
      notes: "New return",
    };
    const res: ExpenseResponse = await auth().post("/expenses").send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/expenses").send({
      productionDayId: -1,
      amount: -300,
      type: ExpenseType.SUNDRIES,
      occurredAt: "badDate",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
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

  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/expenses").send({
      productionDayId: 99999999,
      amount: 300,
      type: ExpenseType.SUNDRIES,
      occurredAt: "2026-10-10T09:00:00.000Z",
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No productionDay exists with that ID");
  });
});

describe("PATCH /expenses/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const expense = seed.expenses[0];
    const res: ExpenseResponse = await auth()
      .patch(`/expenses/${expense.id}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...expense, notes: "Updated notes" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/expenses/badId")
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

  it("should fail if expense return isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/expenses/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Expense not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/expenses/${seed.expenses[0].id}`)
      .send({ productionDayId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
    ]);
  });

  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/expenses/${seed.expenses[0].id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No productionDay exists with that ID");
  });
});

describe("DELETE /expenses/:id", () => {
  it("should delete successfully given valid id", async () => {
    const createdExpense = seed.expenses[3];
    const id = createdExpense.id;
    const res: ExpenseResponse = await auth().delete(`/expenses/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdExpense) });

    const res2: ErrorResponse = await auth().get(`/expenses/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Expense not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/expenses/badId");

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

  it("should fail if productionDay return isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/expenses/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Expense not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
