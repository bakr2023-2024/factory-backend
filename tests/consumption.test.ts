import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  Consumption,
  Item,
  ItemType,
  ProductionDay,
  Season,
  Variant,
  Week,
} from "../src/db/generated/prisma/client";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
} from "../src/utils/types/response.types";
import { json, auth, login } from "./helpers/auth";
import prisma from "../src/db/prisma";

type ConsumptionResponse = DataResponse<Consumption>;
type PaginatedConsumptionsResponse = PaginationResponse<Consumption[]>;

const mockSeason = {
  name: "season 1",
  startDate: new Date("2026-09-24T00:00:00Z"),
};

let createdSeason: Season;

const mockWeeks = [
  {
    startDate: new Date("2026-09-24T00:00:00Z"),
  },
  {
    startDate: new Date("2026-09-27T00:00:00Z"),
  },
];

let createdWeeks: Week[];

const mockProductionDays = [
  {
    productionDate: new Date("2026-09-24T00:00:00Z"),
    startedAt: new Date("2026-09-24T08:00:00Z"),
  },
  {
    productionDate: new Date("2026-09-25T00:00:00Z"),
    startedAt: new Date("2026-09-25T08:00:00Z"),
  },
  {
    productionDate: new Date("2026-09-27T00:00:00Z"),
    startedAt: new Date("2026-09-27T08:00:00Z"),
  },
];

let createdProductionDays: ProductionDay[];

const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];

let createdItems: Item[];

const mockVariants: {
  itemId: number;
  unitWeight: number;
}[] = [];

let createdVariants: Variant[] = [];

const mockConsumptions: {
  productionDayId: number;
  variantId: number;
  occurredAt: Date;
  quantity: number;
  notes?: string;
}[] = [];

beforeAll(async () => {
  await login();

  await prisma.consumption.deleteMany({});
  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});

  createdSeason = await prisma.season.create({
    data: mockSeason,
  });

  createdWeeks = await prisma.week.createManyAndReturn({
    data: mockWeeks.map((week) => ({
      ...week,
      seasonId: createdSeason.id,
    })),
  });

  createdProductionDays = await prisma.productionDay.createManyAndReturn({
    data: [
      {
        ...mockProductionDays[0],
        weekId: createdWeeks[0].id,
      },
      {
        ...mockProductionDays[1],
        weekId: createdWeeks[0].id,
      },
      {
        ...mockProductionDays[2],
        weekId: createdWeeks[1].id,
      },
    ],
  });

  createdItems = await prisma.item.createManyAndReturn({
    data: mockItems,
  });

  mockVariants.push(
    {
      itemId: createdItems[0].id,
      unitWeight: 5,
    },
    {
      itemId: createdItems[0].id,
      unitWeight: 7,
    },
    {
      itemId: createdItems[1].id,
      unitWeight: 3,
    },
  );

  createdVariants = await prisma.variant.createManyAndReturn({
    data: mockVariants,
  });

  mockConsumptions.push(
    {
      productionDayId: createdProductionDays[0].id,
      variantId: createdVariants[0].id,
      occurredAt: new Date("2026-09-24T09:00:00Z"),
      quantity: 10,
      notes: "First consumption",
    },
    {
      productionDayId: createdProductionDays[0].id,
      variantId: createdVariants[1].id,
      occurredAt: new Date("2026-09-24T10:00:00Z"),
      quantity: 20,
      notes: "Second consumption",
    },
    {
      productionDayId: createdProductionDays[1].id,
      variantId: createdVariants[2].id,
      occurredAt: new Date("2026-09-25T09:00:00Z"),
      quantity: 15,
    },
    {
      productionDayId: createdProductionDays[2].id,
      variantId: createdVariants[0].id,
      occurredAt: new Date("2026-09-27T09:00:00Z"),
      quantity: 30,
    },
  );
});

describe("GET /consumptions", () => {
  let createdConsumptions: Consumption[] = [];

  beforeAll(async () => {
    createdConsumptions = await prisma.consumption.createManyAndReturn({
      data: mockConsumptions,
    });
  });

  it("should return all consumptions", async () => {
    const res: PaginatedConsumptionsResponse =
      await auth().get("/consumptions");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: createdConsumptions,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: createdConsumptions.length,
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
        data: [createdConsumptions[2], createdConsumptions[3]],
        page: 2,
        size: 2,
        totalPages: 2,
        totalCount: 4,
      }),
    );
  });

  it("should return all consumptions given productionDayId", async () => {
    const productionDayId = createdProductionDays[0].id;

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?productionDayId=${productionDayId}`,
    );

    const filtered = createdConsumptions.filter(
      (consumption) => consumption.productionDayId === productionDayId,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given variantId", async () => {
    const variantId = createdVariants[0].id;

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?variantId=${variantId}`,
    );

    const filtered = createdConsumptions.filter(
      (consumption) => consumption.variantId === variantId,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given productionDate", async () => {
    const productionDate = "2026-09-24";

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?productionDate=${productionDate}`,
    );

    const filtered = createdConsumptions.filter((consumption) => {
      const productionDay = createdProductionDays.find(
        (productionDay) => productionDay.id === consumption.productionDayId,
      );

      return (
        productionDay!.productionDate.toISOString().slice(0, 10) ===
        productionDate
      );
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions that relate to queried Name", async () => {
    const res: PaginatedConsumptionsResponse = await auth().get(
      "/consumptions?itemName=Fruit%20Tofu",
    );

    const filtered = createdConsumptions.filter((consumption) => {
      const variant = createdVariants.find(
        (variant) => variant.id === consumption.variantId,
      )!;

      const item = createdItems.find(
        (item) => item.id === variant.itemId && item.name === "Fruit Tofu",
      );

      return item;
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given unitWeight", async () => {
    const unitWeight = 5;

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?unitWeight=${unitWeight}`,
    );

    const variantIds = createdVariants
      .filter((variant) => variant.unitWeight.toNumber() == unitWeight)
      .map((variant) => variant.id);

    const filtered = createdConsumptions.filter((consumption) =>
      variantIds.includes(consumption.variantId),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given quantity", async () => {
    const quantity = 20;

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?quantity=${quantity}`,
    );

    const filtered = createdConsumptions.filter(
      (consumption) => consumption.quantity === quantity,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given occurredFrom", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?occurredFrom=${encodeURIComponent(occurredFrom)}`,
    );

    const filtered = createdConsumptions.filter(
      (consumption) => consumption.occurredAt >= new Date(occurredFrom),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given occurredTo", async () => {
    const occurredTo = "2026-09-25T09:00:00.000Z";

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = createdConsumptions.filter(
      (consumption) => consumption.occurredAt <= new Date(occurredTo),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions given occurredFrom and occurredTo", async () => {
    const occurredFrom = "2026-09-24T10:00:00.000Z";
    const occurredTo = "2026-09-25T09:00:00.000Z";

    const res: PaginatedConsumptionsResponse = await auth().get(
      `/consumptions?occurredFrom=${encodeURIComponent(
        occurredFrom,
      )}&occurredTo=${encodeURIComponent(occurredTo)}`,
    );

    const filtered = createdConsumptions.filter(
      (consumption) =>
        consumption.occurredAt >= new Date(occurredFrom) &&
        consumption.occurredAt <= new Date(occurredTo),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: filtered,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: filtered.length,
      }),
    );
  });

  it("should return all consumptions sorted according to sortBy and order", async () => {
    const res: PaginatedConsumptionsResponse = await auth().get(
      "/consumptions?sortBy=occurredAt&order=desc",
    );

    const sorted = createdConsumptions.toSorted(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime(),
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: sorted,
        page: 1,
        size: 20,
        totalPages: 1,
        totalCount: sorted.length,
      }),
    );
  });
});

describe("GET /consumptions/:id", () => {
  let createdConsumption: Consumption;

  beforeAll(async () => {
    await prisma.consumption.deleteMany({});

    createdConsumption = await prisma.consumption.create({
      data: mockConsumptions[0],
    });
  });

  it("should return consumption given valid id", async () => {
    const id = createdConsumption.id;

    const res: ConsumptionResponse = await auth().get(`/consumptions/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdConsumption),
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/consumptions/badId");

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

  it("should fail if consumption isn't found", async () => {
    const res: ErrorResponse = await auth().get("/consumptions/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Consumption not found");
  });
});

describe("POST /consumptions", () => {
  beforeAll(async () => {
    await prisma.consumption.deleteMany({});
  });

  it("should create consumption successfully given valid data", async () => {
    const res: ConsumptionResponse = await auth()
      .post("/consumptions")
      .send(mockConsumptions[0]);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(
      json({
        data: mockConsumptions[0],
      }),
    );
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
        message: "ID can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "ID can only be a positive integer",
        path: ["variantId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["occurredAt"],
      },
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
    ]);
  });

  it("should fail if productionDay/variant aren't found", async () => {
    const res: ErrorResponse = await auth()
      .post("/consumptions")
      .send({
        ...mockConsumptions[0],
        productionDayId: 99999999,
        variantId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
});

describe("PATCH /consumptions/:id", () => {
  let createdConsumption: Consumption;

  beforeAll(async () => {
    await prisma.consumption.deleteMany({});

    createdConsumption = await prisma.consumption.create({
      data: mockConsumptions[0],
    });
  });

  it("should correctly update field(s) given id and field(s) to change", async () => {
    const id = createdConsumption.id;

    const res: ConsumptionResponse = await auth()
      .patch(`/consumptions/${id}`)
      .send({
        quantity: 50,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...createdConsumption,
          quantity: 50,
        }),
        updatedAt: expect.any(String),
      },
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
        message: "ID can only be a positive integer",
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
      .patch(`/consumptions/${createdConsumption.id}`)
      .send({ quantity: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "quantity can only be a positive integer",
        path: ["quantity"],
      },
    ]);
  });

  it("should fail if productionDay/variant aren't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/consumptions/${createdConsumption.id}`)
      .send({
        productionDayId: 99999999,
        variantId: 99999999,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No productionDay/variant exists with that ID",
    );
  });
});

describe("DELETE /consumptions/:id", () => {
  let createdConsumption: Consumption;

  beforeAll(async () => {
    await prisma.consumption.deleteMany({});

    createdConsumption = await prisma.consumption.create({
      data: mockConsumptions[0],
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdConsumption.id;

    const res: ConsumptionResponse = await auth().delete(`/consumptions/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: json(createdConsumption),
    });

    const res2: ErrorResponse = await auth().get(`/consumptions/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Consumption not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/consumptions/badId");

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

  it("should fail if consumption isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/consumptions/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Consumption not found");
  });
});

afterAll(async () => {
  await prisma.consumption.deleteMany({});
  await prisma.productionDay.deleteMany({});
  await prisma.week.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.variant.deleteMany({});
  await prisma.item.deleteMany({});
  await prisma.$disconnect();
});
