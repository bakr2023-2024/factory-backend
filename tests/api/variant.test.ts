import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Variant } from "../../src/db/generated/prisma/client";
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

type VariantResponse = DataResponse<Variant>;
type PaginatedVariantsResponse = PaginationResponse<Variant[]>;

let seed: MockData;

beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /variants", () => {
  it("should return all variants", async () => {
    const res: PaginatedVariantsResponse = await auth().get("/variants");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.variants,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.variants.length / 20),
        totalCount: seed.variants.length,
      }),
    );
  });

  it("should return paginated variants given page and size", async () => {
    const res: PaginatedVariantsResponse = await auth().get(
      "/variants?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.variants.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.variants.length / 2),
        totalCount: seed.variants.length,
      }),
    );
  });

  it("should return all variants that relate to queried itemName", async () => {
    const itemName = seed.items[0].name;

    const res: PaginatedVariantsResponse = await auth().get(
      `/variants?itemName=${encodeURIComponent(itemName)}`,
    );

    const filtered = seed.variants.filter(
      (variant) => variant.itemId === seed.items[0].id,
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
  it("should return all variants given type", async () => {
    const res: VariantResponse = await auth().get("/variants?type=BOX");
    const filtered = seed.variants.filter((v) => v.type === "BOX");
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
  it("should return all variants sorted according to sortBy and order", async () => {
    const res: PaginatedVariantsResponse = await auth().get(
      "/variants?sortBy=unitWeight&order=desc",
    );

    const sorted = seed.variants.toSorted((a, b) =>
      b.unitWeight.comparedTo(a.unitWeight),
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

describe("GET /variants/:id", () => {
  it("should return variant given valid id", async () => {
    const variant = seed.variants[0];

    const res: VariantResponse = await auth().get(
      `/variants/${variant.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(variant) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/variants/badId");

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

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await auth().get("/variants/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Variant not found");
  });
});

describe("POST /variants", () => {
  it("should create variant successfully given itemId and unitWeight", async () => {
    const payload = {
      itemId: seed.items[0].id,
      unitWeight: 99,
    };

    const res: VariantResponse = await auth()
      .post("/variants")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid itemId or invalid unitWeight", async () => {
    const res: ErrorResponse = await auth()
      .post("/variants")
      .send({ itemId: -1, unitWeight: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["itemId"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["unitWeight"],
      },
    ]);
  });

  it("should fail given non-existent itemId", async () => {
    const res: ErrorResponse = await auth()
      .post("/variants")
      .send({ itemId: 99999999, unitWeight: 1 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No item exists with this ID");
  });
});

describe("PATCH /variants/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const variant = seed.variants[0];

    const res: VariantResponse = await auth()
      .patch(`/variants/${variant.id}`)
      .send({
        itemId: seed.items[1].id,
        unitWeight: 10,
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({
          ...variant,
          itemId: seed.items[1].id,
          unitWeight: 10,
        }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/variants/badId")
      .send({ unitWeight: 7 });

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

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/variants/99999999")
      .send({ unitWeight: 12 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Variant not found");
  });

  it("should fail given invalid itemId or invalid unitWeight", async () => {
    const variant = seed.variants[0];

    const res: ErrorResponse = await auth()
      .patch(`/variants/${variant.id}`)
      .send({ itemId: -1, unitWeight: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["itemId"],
      },
      {
        key: "body",
        message: "value can only be a positive number",
        path: ["unitWeight"],
      },
    ]);
  });

  it("should fail given non-existent itemId", async () => {
    const variant = seed.variants[0];

    const res: ErrorResponse = await auth()
      .patch(`/variants/${variant.id}`)
      .send({ itemId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe("No item exists with that ID");
  });
});

describe("DELETE /variants/:id", () => {
  it("should delete successfully given valid id", async () => {
    const variant = seed.variants[4];
    const res: VariantResponse = await auth().delete(
      `/variants/${variant.id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(variant) });
    
    const res2: ErrorResponse = await auth().get(
      `/variants/${variant.id}`,
    );
    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Variant not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/variants/badId");

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

  it("should fail if variant isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/variants/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Variant not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});