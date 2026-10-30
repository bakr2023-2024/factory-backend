import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Consumption,
  StockMovement,
} from "../../src/db/generated/prisma/client";
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

type ConsumptionResponse = DataResponse<Consumption>;
type PaginatedConsumptionsResponse = PaginationResponse<Consumption[]>;
type PaginatedStockMovementResponse = PaginationResponse<StockMovement[]>;
let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /consumptions", () => {
  it("should return all consumptions", async () => {
    const res: PaginatedConsumptionsResponse =
      await auth().get("/consumptions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.consumptions,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.consumptions.length / 20),
        totalCount: seed.consumptions.length,
      }),
    );
  });

  it("should return paginated consumptions given page and size", async () => {
    const res: PaginatedConsumptionsResponse = await auth().get(
      "/consumptions?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.consumptions.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.consumptions.length / 2),
        totalCount: seed.consumptions.length,
      }),
    );
  });

  it("should return all consumptions given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?productionDayId=${productionDayId}`,
    );
    const filtered = seed.consumptions.filter(
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

  it("should return all consumptions given variantId", async () => {
    const variantId = seed.variants[0].id;
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?variantId=${variantId}`,
    );
    const filtered = seed.consumptions.filter((c) => c.variantId === variantId);

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

  it("should return all consumptions given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.consumptions.filter((c) =>
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

  it("should return all consumptions that relate to queried itemName", async () => {
    const item = seed.items[0];
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?itemName=${encodeURIComponent(item.name)}`,
    );
    const variantIds = seed.variants
      .filter((v) => v.itemId === item.id)
      .map((v) => v.id);
    const filtered = seed.consumptions.filter((c) =>
      variantIds.includes(c.variantId),
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

  it("should return all consumptions given unitWeight", async () => {
    const unitWeight = seed.variants[0].unitWeight.toNumber();
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?unitWeight=${unitWeight}`,
    );
    const variantIds = seed.variants
      .filter((v) => v.unitWeight.toNumber() === unitWeight)
      .map((v) => v.id);
    const filtered = seed.consumptions.filter((c) =>
      variantIds.includes(c.variantId),
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

  it("should return all consumptions given quantity", async () => {
    const quantity = seed.consumptions[1].quantity;
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?quantity=${quantity}`,
    );
    const filtered = seed.consumptions.filter((c) => c.quantity === quantity);

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

  it("should return all consumptions given occurredFrom", async () => {
    const occurredFrom = new Date(
      seed.consumptions[0].occurredAt.getTime() + 3600000,
    );
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}`,
    );
    const filtered = seed.consumptions.filter(
      (c) => c.occurredAt >= occurredFrom,
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

  it("should return all consumptions given occurredTo", async () => {
    const occurredTo = new Date(
      seed.consumptions[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.consumptions.filter(
      (c) => c.occurredAt <= occurredTo,
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

  it("should return all consumptions given occurredFrom and occurredTo", async () => {
    const occurredFrom = new Date(
      seed.consumptions[0].occurredAt.getTime() + 3600000,
    );
    const occurredTo = new Date(
      seed.consumptions[2].occurredAt.getTime() - 3600000,
    );
    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?occurredFrom=${encodeURIComponent(occurredFrom.toISOString())}&occurredTo=${encodeURIComponent(occurredTo.toISOString())}`,
    );
    const filtered = seed.consumptions.filter(
      (c) => c.occurredAt >= occurredFrom && c.occurredAt <= occurredTo,
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

  it("should return all consumptions sorted according to sortBy and order", async () => {
    const res: PaginatedConsumptionsResponse = await auth().get(
      "/consumptions?sortBy=occurredAt&order=desc",
    );
    const sorted = seed.consumptions.toSorted(
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

describe("GET /consumptions/:id", () => {
  it("should return consumption given valid id", async () => {
    const consumption = seed.consumptions[0];
    const res: ConsumptionResponse = await auth().get(
      `/consumptions/${consumption.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(consumption) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/consumptions/badId");

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

  it("should fail if consumption isn't found", async () => {
    const res: ErrorResponse = await auth().get("/consumptions/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Consumption not found");
  });
});

describe("POST /consumptions", () => {
  it("should create consumption successfully given valid data", async () => {
    const payload = {
      productionDayId: seed.productionDays[3].id,
      variantId: seed.variants[1].id,
      quantity: 2,
    };
    const res: ConsumptionResponse = await auth()
      .post("/consumptions")
      .send(payload);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=CONSUMPTION&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "CONSUMPTION",
      quantityChanged: -payload.quantity,
    });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth().post("/consumptions").send({
      productionDayId: -1,
      variantId: -1,
      occurredAt: "badDate",
      quantity: -1,
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
        message: "value can only be a positive integer",
        path: ["variantId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["quantity"],
      },
    ]);
  });

  it("should fail if productionDay/variant aren't found", async () => {
    const res: ErrorResponse = await auth().post("/consumptions").send({
      productionDayId: 99999999,
      variantId: 99999999,
      occurredAt: "2026-09-24T12:00:00.000Z",
      quantity: 7,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
  it("should fail if consumption quantity is higher than current inventory", async () => {
    const res: ErrorResponse = await auth().post("/consumptions").send({
      variantId: seed.variants[3].id,
      productionDayId: seed.productionDays[0].id,
      quantity: 99999999,
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "consumption quantity can't be higher than current inventory",
    );
  });
});

describe("PATCH /consumptions/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const consumption = seed.consumptions[0];
    const res: ConsumptionResponse = await auth()
      .patch(`/consumptions/${consumption.id}`)
      .send({ quantity: 50 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...consumption, quantity: 50 }),
        updatedAt: expect.any(String),
      },
    });
    const res2: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=CONSUMPTION&typeRef=${res.body.data.id}`,
    );
    expect(res2.status).toBe(200);
    expect(res2.body.data[0]).toMatchObject({
      typeRef: res.body.data.id,
      type: "CONSUMPTION",
      quantityChanged: -50,
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/consumptions/badId")
      .send({ quantity: 50 });

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

  it("should fail if consumption isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/consumptions/99999999")
      .send({ quantity: 50 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Consumption not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/consumptions/${seed.consumptions[0].id}`)
      .send({ quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["quantity"],
      },
    ]);
  });

  it("should fail if productionDay/variant aren't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/consumptions/${seed.consumptions[0].id}`)
      .send({ productionDayId: 99999999, variantId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
  it("should fail if consumption quantity is higher than current inventory", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/consumptions/${seed.consumptions[0].id}`)
      .send({ quantity: 99999999 });
    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "consumption quantity can't be higher than current inventory",
    );
  });
});

describe("DELETE /consumptions/:id", () => {
  it("should delete successfully given valid id", async () => {
    const consumption = seed.consumptions[1];
    const res: ConsumptionResponse = await auth().delete(
      `/consumptions/${consumption.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(consumption) });

    const res2: ErrorResponse = await auth().get(
      `/consumptions/${consumption.id}`,
    );

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Consumption not found");
    const res3: PaginatedStockMovementResponse = await auth().get(
      `/stockMovements?type=CONSUMPTION&typeRef=${res.body.data.id}`,
    );
    expect(res3.status).toBe(200);
    expect(res3.body.data.length).toBe(0);
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/consumptions/badId");

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

  it("should fail if consumption isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/consumptions/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Consumption not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
