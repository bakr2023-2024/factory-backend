import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });

import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import { Attendance } from "../../src/db/generated/prisma/client";
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

type AttendanceResponse = DataResponse<Attendance>;
type PaginatedAttendancesResponse = PaginationResponse<Attendance[]>;

let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});

describe("GET /attendances", () => {
  it("should return all attendance", async () => {
    const res: PaginatedAttendancesResponse = await auth().get("/attendances");

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.attendances,
        page: 1,
        size: 20,
        totalPages: Math.ceil(seed.attendances.length / 20),
        totalCount: seed.attendances.length,
      }),
    );
  });

  it("should return paginated attendance given page and size", async () => {
    const res: PaginatedAttendancesResponse = await auth().get(
      "/attendances?page=2&size=2",
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      json({
        data: seed.attendances.slice(2, 4),
        page: 2,
        size: 2,
        totalPages: Math.ceil(seed.attendances.length / 2),
        totalCount: seed.attendances.length,
      }),
    );
  });

  it("should return all attendance given laborerId", async () => {
    const laborerId = seed.laborers[1].id;
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?laborerId=${laborerId}`,
    );
    const filtered = seed.attendances.filter((r) => r.laborerId === laborerId);
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
  it("should return all attendance given laborerName", async () => {
    const laborerName = seed.laborers[0].name;
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?laborerName=${encodeURIComponent(laborerName)}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.name === laborerName)
      .map((c) => c.id);
    const filtered = seed.attendances.filter((r) =>
      laborerIds.includes(r.laborerId),
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
  it("should return all attendance given laborerNumber", async () => {
    const laborerNumber = seed.laborers[1].number!;
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?laborerNumber=${laborerNumber}`,
    );
    const laborerIds = seed.laborers
      .filter((c) => c.number === laborerNumber)
      .map((c) => c.id);
    const filtered = seed.attendances.filter((r) =>
      laborerIds.includes(r.laborerId),
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
  it("should return all attendance given productionDayId", async () => {
    const productionDayId = seed.productionDays[0].id;
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?productionDayId=${productionDayId}`,
    );
    const filtered = seed.attendances.filter(
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
  it("should return all attendance given productionDate", async () => {
    const productionDate = seed.productionDays[0].productionDate
      .toISOString()
      .slice(0, 10);
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?productionDate=${productionDate}`,
    );
    const dayIds = seed.productionDays
      .filter(
        (d) => d.productionDate.toISOString().slice(0, 10) === productionDate,
      )
      .map((d) => d.id);
    const filtered = seed.attendances.filter((c) =>
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
  it("should return all attendance given cameAt", async () => {
    const cameAt = seed.attendances[0].cameAt.toISOString();
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?cameAt=${encodeURIComponent(cameAt)}`,
    );
    const filtered = seed.attendances.filter(
      (r) => r.cameAt.toISOString() >= cameAt,
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
  it("should return all attendance given factor", async () => {
    const factor = seed.attendances[0].factor.toNumber();
    const res: PaginatedAttendancesResponse = await auth().get(
      `/attendances?factor=${factor}`,
    );
    const filtered = seed.attendances.filter(
      (r) => r.factor.toNumber() == factor,
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
  it("should return all attendance sorted according to sortBy and order", async () => {
    const res: PaginatedAttendancesResponse = await auth().get(
      "/attendances?sortBy=cameAt&order=desc",
    );
    const sorted = seed.attendances.toSorted(
      (a, b) => b.cameAt.getTime() - a.cameAt.getTime(),
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

describe("GET /attendances/:id", () => {
  it("should return attendance given valid id", async () => {
    const attendance = seed.attendances[0];
    const res: AttendanceResponse = await auth().get(
      `/attendances/${attendance.id}`,
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(attendance) });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().get("/attendances/badId");

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

  it("should fail if attendance isn't found", async () => {
    const res: ErrorResponse = await auth().get("/attendances/999999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Attendance not found");
  });
});

describe("POST /attendances", () => {
  it("should create attendance successfully given valid data", async () => {
    const payload = {
      laborerId: seed.laborers[0].id,
      productionDayId: seed.productionDays[2].id,
    };
    const res: AttendanceResponse = await auth()
      .post("/attendances")
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ data: payload });
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .post("/attendances")
      .send({ laborerId: -1, productionDayId: -1, cameAt: "badDate" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["laborerId"],
      },
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["productionDayId"],
      },
      {
        key: "body",
        message: "Invalid DateTime",
        path: ["cameAt"],
      },
    ]);
  });

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth().post("/attendances").send({
      laborerId: 99999999,
      productionDayId: seed.productionDays[2].id,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No laborer/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth().post("/attendances").send({
      productionDayId: 99999999,
      laborerId: seed.laborers[2].id,
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No laborer/productionDay exists with that ID",
    );
  });
});

describe("PATCH /attendances/:id", () => {
  it("should correctly update field(s) given id and field(s) to change", async () => {
    const attendance = seed.attendances[0];
    const res: AttendanceResponse = await auth()
      .patch(`/attendances/${attendance.id}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ...json({ ...attendance, notes: "Updated notes" }),
        updatedAt: expect.any(String),
      },
    });
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth()
      .patch("/attendances/badId")
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

  it("should fail if attendance isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch("/attendances/99999999")
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Attendance not found");
  });

  it("should fail given invalid data", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/attendances/${seed.attendances[0].id}`)
      .send({ laborerId: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Validation Error");
    expect(res.body.cause).toEqual([
      {
        key: "body",
        message: "value can only be a positive integer",
        path: ["laborerId"],
      },
    ]);
  });

  it("should fail if laborer isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/attendances/${seed.attendances[0].id}`)
      .send({ laborerId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No laborer/productionDay exists with that ID",
    );
  });
  it("should fail if productionDay isn't found", async () => {
    const res: ErrorResponse = await auth()
      .patch(`/attendances/${seed.attendances[0].id}`)
      .send({ productionDayId: 99999999 });

    expect(res.status).toBe(409);
    expect(res.body.message).toBe(
      "No laborer/productionDay exists with that ID",
    );
  });
});

describe("DELETE /attendances/:id", () => {
  let createdAttendance: Attendance;

  beforeAll(async () => {
    createdAttendance = await prisma.attendance.create({
      data: {
        laborerId: seed.laborers[0].id,
        productionDayId: seed.productionDays[1].id,
      },
    });
  });

  it("should delete successfully given valid id", async () => {
    const id = createdAttendance.id;
    const res: AttendanceResponse = await auth().delete(`/attendances/${id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: json(createdAttendance) });

    const res2: ErrorResponse = await auth().get(`/attendances/${id}`);

    expect(res2.status).toBe(404);
    expect(res2.body.message).toBe("Attendance not found");
  });

  it("should fail given invalid id", async () => {
    const res: ErrorResponse = await auth().delete("/attendances/badId");

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

  it("should fail if attendance isn't found", async () => {
    const res: ErrorResponse = await auth().delete("/attendances/99999999");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Attendance not found");
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
