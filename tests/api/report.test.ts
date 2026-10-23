import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve("config", ".env.dev") });
import { describe, it, beforeAll, afterAll, expect } from "@jest/globals";
import {
  DataResponse,
  ErrorResponse,
  PaginationResponse,
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
            (sm) => sm.variantId == variant.id && sm.productionDayId < day.id,
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
            (sm) => sm.variantId == variant.id && sm.productionDayId < day.id,
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
    const season = byId(seed.seasons, week.id);
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
});

afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
