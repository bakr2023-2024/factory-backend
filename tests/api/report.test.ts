import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  DataResponse,
  ErrorResponse,
} from "../../src/utils/types/response.types";
import prisma from "../../src/db/prisma";
import {
  json,
  auth,
  login,
  cleanDatabase,
  populateDatabase,
  MockData,
} from "../utils";
import { ProductionDaySheet } from "../../src/modules/report/report.service";
const byId = <T extends { id: number }>(rows: T[], id: number) =>
  rows.find((r) => r.id === id)!;
type Totals = {
  seasonWeightBefore: number;
  todayTotalWeight: number;
  seasonWeightTotal: number;
};
const getTotals = (id: number): Map<number, Totals> => {
  const day = byId(seed.productionDays, id);
  const map = seed.productionEntries
    .filter((pe) => {
      const currDay = byId(seed.productionDays, pe.productionDayId);
      const currDaySeasonId = byId(
        seed.weeks,
        byId(seed.productionDays, currDay.id).weekId,
      ).seasonId;
      const seasonId = byId(
        seed.weeks,
        byId(seed.productionDays, day.id).weekId,
      ).seasonId;
      return (
        currDay.productionDate <= day.productionDate &&
        currDaySeasonId == seasonId
      );
    })
    .reduce((map, pe) => {
      if (!map.has(pe.productionDayId))
        map.set(
          pe.productionDayId,
          new Map<number, { unitWeight: number; quantity: number }>(),
        );
      map.get(pe.productionDayId)!.set(pe.id, {
        unitWeight: byId(seed.variants, pe.variantId).unitWeight.toNumber(),
        quantity: 0,
      });
      return map;
    }, new Map<number, Map<number, { unitWeight: number; quantity: number }>>());
  for (const batch of seed.productionBatches) {
    const entry = byId(seed.productionEntries, batch.productionEntryId);
    const currDay = byId(seed.productionDays, entry.productionDayId);
    const currDaySeasonId = byId(
      seed.weeks,
      byId(seed.productionDays, currDay.id).weekId,
    ).seasonId;
    const seasonId = byId(
      seed.weeks,
      byId(seed.productionDays, day.id).weekId,
    ).seasonId;
    if (
      currDay.productionDate > day.productionDate ||
      currDaySeasonId != seasonId
    )
      continue;
    map.get(currDay.id)!.get(entry.id)!.quantity += batch.quantity;
  }
  return [...map]
    .sort((a, b) => {
      const aDate = byId(seed.productionDays, +a[0]).productionDate;
      const bDate = byId(seed.productionDays, +b[0]).productionDate;
      return aDate.getTime() - bDate.getTime();
    })
    .reduce((totals, [dayId, entriesMap], idx, arr) => {
      const seasonWeightBefore =
        idx == 0 ? 0 : totals.get(+arr[idx - 1][0])!.seasonWeightTotal;
      const todayTotalWeight = [...entriesMap].reduce(
        (acc, [_, val]) => acc + val.unitWeight * val.quantity,
        0,
      );
      const seasonWeightTotal = seasonWeightBefore + todayTotalWeight;
      totals.set(+dayId, {
        seasonWeightBefore,
        todayTotalWeight,
        seasonWeightTotal,
      });
      return totals;
    }, new Map<number, Totals>());
};
let seed: MockData;
beforeAll(async () => {
  await cleanDatabase();
  seed = await populateDatabase();
  await login();
});
type ProductionDaySheetResponse = DataResponse<ProductionDaySheet>;
describe("GET reports/sheet/:id", () => {
  it("should return report sheet given productionDayId", async () => {
    const day = seed.productionDays[0];
    const res: ProductionDaySheetResponse = await auth().get(
      `/reports/sheet/${day.id}`,
    );
    const rows = seed.productionEntries
      .filter((pe) => pe.productionDayId == day.id)
      .map((pe) => {
        const batches = seed.productionBatches.filter(
          (pd) => pd.productionEntryId == pe.id,
        );
        const variant = byId(seed.variants, pe.variantId);
        const item = byId(seed.items, variant.itemId);
        const quantity = batches.reduce((acc, b) => acc + b.quantity, 0);
        return {
          entryId: pe.id,
          variant: { ...variant, item },
          batches,
          totalQuantity: quantity,
          totalWeight: quantity * variant.unitWeight.toNumber(),
        };
      });
    const todayWeight = rows.reduce((acc, r) => acc + r.totalWeight, 0);
    const imports = seed.imports
      .filter((i) => i.productionDayId == day.id)
      .map((i) => {
        const importItems = seed.importItems
          .filter((ii) => ii.importId == i.id)
          .map((ii) => {
            const variant = byId(seed.variants, ii.variantId);
            const item = byId(seed.items, variant.itemId);
            return { ...ii, variant: { ...variant, item } };
          });
        return { ...i, importItems };
      });
    const exports = seed.exports
      .filter((i) => i.productionDayId == day.id)
      .map((i) => {
        const exportItems = seed.exportItems
          .filter((ii) => ii.exportId == i.id)
          .map((ii) => {
            const variant = byId(seed.variants, ii.variantId);
            const item = byId(seed.items, variant.itemId);
            return { ...ii, variant: { ...variant, item } };
          });
        return { ...i, exportItems };
      });
    const materials = seed.variants
      .filter((v) => byId(seed.items, v.itemId).type == "MATERIAL")
      .map((v) => {
        const variant = { ...v, item: byId(seed.items, v.itemId) };
        const openingBalance = seed.stockMovements
          .filter(
            (sm) =>
              sm.variantId == variant.id &&
              byId(seed.productionDays, sm.productionDayId).productionDate <
                day.productionDate,
          )
          .reduce((acc, sm) => acc + sm.quantityChanged, 0);
        const changes = seed.stockMovements
          .filter(
            (sm) => sm.variantId == variant.id && sm.productionDayId == day.id,
          )
          .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
        const changeAmount = changes.reduce(
          (acc, sm) => acc + sm.quantityChanged,
          0,
        );
        const closingBalance = openingBalance + changeAmount;
        return {
          variant,
          openingBalance,
          changes,
          changeAmount,
          closingBalance,
        };
      });
    const products = seed.variants
      .filter((v) => byId(seed.items, v.itemId).type == "PRODUCT")
      .map((v) => {
        const variant = { ...v, item: byId(seed.items, v.itemId) };
        const openingBalance = seed.stockMovements
          .filter(
            (sm) =>
              sm.variantId == variant.id &&
              byId(seed.productionDays, sm.productionDayId).productionDate <
                day.productionDate,
          )
          .reduce((acc, sm) => acc + sm.quantityChanged, 0);
        const changes = seed.stockMovements
          .filter(
            (sm) => sm.variantId == variant.id && sm.productionDayId == day.id,
          )
          .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
        const changeAmount = changes.reduce(
          (acc, sm) => acc + sm.quantityChanged,
          0,
        );
        const closingBalance = openingBalance + changeAmount;
        return {
          variant,
          openingBalance,
          changes,
          changeAmount,
          closingBalance,
        };
      });
    const week = byId(seed.weeks, day.weekId);
    const season = byId(seed.seasons, week.seasonId);
    const expected: ProductionDaySheet = {
      productionDay: day,
      week,
      season,
      seasonWeightBefore: 0,
      todayTotalWeight: todayWeight,
      seasonWeightTotal: todayWeight,
      productionRows: rows,
      imports,
      exports,
      materialsInventory: materials,
      productsInventory: products,
    };
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(json(expected));
  });
  it("should fail given invalid productionDayId", async () => {
    const res: ErrorResponse = await auth().get("/reports/sheet/badID");
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
  it("should fail if production day is not found", async () => {
    const res: ErrorResponse = await auth().get("/reports/sheet/99999999");
    expect(res.status).toBe(404);
    expect(res.body.message).toBe("ProductionDay not found");
  });
  it("should return report sheet with correct totals that were derived from previous days", async () => {
    const today = seed.productionDays[4];
    const res: ProductionDaySheetResponse = await auth().get(
      `/reports/sheet/${today.id}`,
    );
    expect(res.status).toBe(200);
    let t = getTotals(today.id);
    const totals = t.get(today.id)!;
    expect(res.body.data.seasonWeightBefore).toBe(totals.seasonWeightBefore);
    expect(res.body.data.todayTotalWeight).toBe(totals.todayTotalWeight);
    expect(res.body.data.seasonWeightTotal).toBe(totals.seasonWeightTotal);
  });
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
