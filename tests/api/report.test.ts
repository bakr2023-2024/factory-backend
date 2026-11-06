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
import {
  ProductionDaySheet,
  VariantProductionSummary,
} from "../../src/modules/report/report.service";
import { StockMovement } from "../../src/db/generated/prisma/client";
import {
  StockMovementType,
  ItemType,
} from "../../src/db/generated/prisma/enums";
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
type VariantProductionSummaryResponse = DataResponse<VariantProductionSummary>;
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
// ---------- summary helpers ----------
type Filter = { from?: Date; to?: Date; seasonId?: number };
type Priced = { quantity: number; unitPrice: { toNumber(): number } };
type Adjusted = {
  taxAdjustment: { toNumber(): number };
  discountAdjustment: { toNumber(): number };
};

const dayDate = (i: number) => seed.productionDays[i].productionDate;
const dayOf = (id: number) => byId(seed.productionDays, id);
const seasonOf = (productionDayId: number) =>
  byId(seed.weeks, dayOf(productionDayId).weekId).seasonId;
const inFilter = (productionDayId: number, f: Filter) => {
  const t = dayOf(productionDayId).productionDate.getTime();
  return (
    (f.from === undefined || t >= f.from.getTime()) &&
    (f.to === undefined || t <= f.to.getTime()) &&
    (f.seasonId === undefined || seasonOf(productionDayId) === f.seasonId)
  );
};
const query = (f: Filter) => {
  const p = new URLSearchParams();
  if (f.from) p.set("from", f.from.toISOString().slice(0, 10));
  if (f.to) p.set("to", f.to.toISOString().slice(0, 10));
  if (f.seasonId !== undefined) p.set("seasonId", String(f.seasonId));
  return p.toString();
};
const filtersOf = (): Filter[] => [
  {},
  { seasonId: seed.seasons[1].id },
  { from: dayDate(0), to: dayDate(2) },
];
const round2 = (n: number) => Math.round(n * 100) / 100;
const sum = (xs: number[]) => xs.reduce((acc, x) => acc + x, 0);
const sortBy = <T>(rows: T[], key: keyof T) =>
  [...rows].sort((a, b) => (a[key] as number) - (b[key] as number));

const movementsOf = (variantId: number, f: Filter) =>
  seed.stockMovements.filter(
    (m) => m.variantId === variantId && inFilter(m.productionDayId, f),
  );
const movementsOfItem = (itemId: number, f: Filter) =>
  seed.variants
    .filter((v) => v.itemId === itemId)
    .flatMap((v) => movementsOf(v.id, f));
const qty = (ms: StockMovement[], type: StockMovementType) =>
  sum(ms.filter((m) => m.type === type).map((m) => m.quantityChanged));
const weighted = (ms: StockMovement[], type: StockMovementType) =>
  sum(
    ms
      .filter((m) => m.type === type)
      .map(
        (m) =>
          m.quantityChanged *
          byId(seed.variants, m.variantId).unitWeight.toNumber(),
      ),
  );

const lineTotal = (lines: Priced[]) =>
  sum(lines.map((l) => l.quantity * l.unitPrice.toNumber()));
const headerTotal = (lines: Priced[], h: Adjusted) =>
  lineTotal(lines) +
  h.taxAdjustment.toNumber() -
  h.discountAdjustment.toNumber();

// ---------- expected: production ----------
const expectedVariantProduction = (f: Filter) =>
  seed.variants
    .filter((v) => byId(seed.items, v.itemId).type === ItemType.PRODUCT)
    .filter((v) => movementsOf(v.id, f).length > 0)
    .map((v) => {
      const ms = movementsOf(v.id, f);
      const totalProduced = qty(ms, StockMovementType.PRODUCTION_BATCH);
      const totalExported =
        -qty(ms, StockMovementType.EXPORT_ITEM) -
        qty(ms, StockMovementType.CUSTOMER_RETURN_ITEM);
      return {
        variantId: v.id,
        totalProduced,
        totalExported,
        percentage:
          totalProduced === 0
            ? 0
            : round2((totalExported / totalProduced) * 100),
      };
    });

const expectedItemProduction = (f: Filter) =>
  seed.items
    .filter(
      (i) => i.type === ItemType.PRODUCT && movementsOfItem(i.id, f).length > 0,
    )
    .map((i) => {
      const ms = movementsOfItem(i.id, f);
      const totalProducedWeight = round2(
        weighted(ms, StockMovementType.PRODUCTION_BATCH),
      );
      const totalExportedWeight = round2(
        -weighted(ms, StockMovementType.EXPORT_ITEM) -
          weighted(ms, StockMovementType.CUSTOMER_RETURN_ITEM),
      );
      return {
        itemId: i.id,
        totalProducedWeight,
        totalExportedWeight,
        percentage:
          totalProducedWeight === 0
            ? 0
            : round2((totalExportedWeight / totalProducedWeight) * 100),
      };
    });

// ---------- expected: consumption ----------
const expectedVariantConsumption = (f: Filter) =>
  seed.variants
    .filter((v) => byId(seed.items, v.itemId).type === ItemType.MATERIAL)
    .filter((v) => movementsOf(v.id, f).length > 0)
    .map((v) => {
      const ms = movementsOf(v.id, f);
      const totalImported =
        qty(ms, StockMovementType.IMPORT_ITEM) +
        qty(ms, StockMovementType.SUPPLIER_RETURN_ITEM);
      const totalConsumed = -qty(ms, StockMovementType.CONSUMPTION);
      return {
        variantId: v.id,
        totalImported,
        totalConsumed,
        percentage:
          totalImported === 0
            ? 0
            : round2((totalConsumed / totalImported) * 100),
      };
    });

const expectedItemConsumption = (f: Filter) =>
  seed.items
    .filter(
      (i) =>
        i.type === ItemType.MATERIAL && movementsOfItem(i.id, f).length > 0,
    )
    .map((i) => {
      const ms = movementsOfItem(i.id, f);
      const totalImportedWeight = round2(
        weighted(ms, StockMovementType.IMPORT_ITEM) +
          weighted(ms, StockMovementType.SUPPLIER_RETURN_ITEM),
      );
      const totalConsumedWeight = round2(
        -weighted(ms, StockMovementType.CONSUMPTION),
      );
      return {
        itemId: i.id,
        totalImportedWeight,
        totalConsumedWeight,
        percentage:
          totalImportedWeight === 0
            ? 0
            : round2((totalConsumedWeight / totalImportedWeight) * 100),
      };
    });

// ---------- expected: customers and suppliers ----------
const expectedCustomers = (f: Filter) =>
  seed.customers.flatMap((c) => {
    const exps = seed.exports.filter(
      (e) =>
        e.customerId === c.id &&
        inFilter(e.productionDayId, f) &&
        seed.exportItems.some((ei) => ei.exportId === e.id),
    );
    const rets = seed.customerReturns.filter(
      (r) =>
        r.customerId === c.id &&
        inFilter(r.productionDayId, f) &&
        seed.customerReturnItems.some((ri) => ri.customerReturnId === r.id),
    );
    if (exps.length === 0 && rets.length === 0) return [];
    const sales = sum(
      exps.map((e) =>
        headerTotal(
          seed.exportItems.filter((ei) => ei.exportId === e.id),
          e,
        ),
      ),
    );
    const refunds = sum(
      rets.map((r) =>
        headerTotal(
          seed.customerReturnItems.filter((ri) => ri.customerReturnId === r.id),
          r,
        ),
      ),
    );
    const totalSold = round2(sales - refunds);
    const transactions = exps.length;
    return [
      {
        customerId: c.id,
        transactions,
        totalSold,
        averageTransaction:
          transactions === 0 ? 0 : round2(totalSold / transactions),
      },
    ];
  });

const expectedSuppliers = (f: Filter) =>
  seed.suppliers.flatMap((s) => {
    const imps = seed.imports.filter(
      (i) =>
        i.supplierId === s.id &&
        inFilter(i.productionDayId, f) &&
        seed.importItems.some((ii) => ii.importId === i.id),
    );
    const rets = seed.supplierReturns.filter(
      (r) =>
        r.supplierId === s.id &&
        inFilter(r.productionDayId, f) &&
        seed.supplierReturnItems.some((ri) => ri.supplierReturnId === r.id),
    );
    if (imps.length === 0 && rets.length === 0) return [];
    const bought = sum(
      imps.map((i) =>
        headerTotal(
          seed.importItems.filter((ii) => ii.importId === i.id),
          i,
        ),
      ),
    );
    const returned = sum(
      rets.map((r) =>
        headerTotal(
          seed.supplierReturnItems.filter((ri) => ri.supplierReturnId === r.id),
          r,
        ),
      ),
    );
    const totalBought = round2(bought - returned);
    const transactions = imps.length;
    return [
      {
        supplierId: s.id,
        transactions,
        totalBought,
        averageTransaction:
          transactions === 0 ? 0 : round2(totalBought / transactions),
      },
    ];
  });

// ---------- expected: rates, attendance, ledger ----------
const expectedRates = (f: Filter) =>
  seed.rates
    .filter(
      (r) =>
        (f.to === undefined || r.from.getTime() <= f.to.getTime()) &&
        (f.from === undefined ||
          (r.to?.getTime() ?? Infinity) >= f.from.getTime()),
    )
    .map((r) => {
      const days = round2(
        sum(
          seed.attendances
            .filter((a) => a.rateId === r.id)
            .map((a) => a.factor.toNumber()),
        ),
      );
      const payment = seed.payments.find((p) => p.rateId === r.id);
      if (payment)
        return {
          rateId: r.id,
          days,
          gross: payment.gross.toNumber(),
          loans: payment.loans.toNumber(),
          loanPayments: payment.loanPayments.toNumber(),
          net: payment.net.toNumber(),
          paid: true,
          paidAt: payment.occurredAt.toISOString(),
        };
      const gross = round2(days * r.dailySalary.toNumber());
      const loans = round2(
        sum(
          seed.loans
            .filter((l) => l.rateId === r.id)
            .map((l) => l.amount.toNumber()),
        ),
      );
      const loanPayments = round2(
        sum(
          seed.loanPayments
            .filter((p) => p.rateId === r.id)
            .map((p) => p.amount.toNumber()),
        ),
      );
      return {
        rateId: r.id,
        days,
        gross,
        loans,
        loanPayments,
        net: round2(gross - loans + loanPayments),
        paid: false,
        paidAt: null,
      };
    });

const expectedAttendance = (f: Filter) => {
  const atts = seed.attendances.filter((a) => inFilter(a.productionDayId, f));
  const laborerOf = (rateId: number) => byId(seed.rates, rateId).laborerId;
  const laborerIds = [...new Set(atts.map((a) => laborerOf(a.rateId)))];
  return laborerIds.map((laborerId) => {
    const mine = atts.filter((a) => laborerOf(a.rateId) === laborerId);
    const weekIds = [
      ...new Set(mine.map((a) => dayOf(a.productionDayId).weekId)),
    ].sort(
      (x, y) =>
        byId(seed.weeks, x).startDate.getTime() -
        byId(seed.weeks, y).startDate.getTime(),
    );
    return {
      laborerId,
      total: round2(sum(mine.map((a) => a.factor.toNumber()))),
      weeks: weekIds.map((weekId) => ({
        weekId,
        total: round2(
          sum(
            mine
              .filter((a) => dayOf(a.productionDayId).weekId === weekId)
              .map((a) => a.factor.toNumber()),
          ),
        ),
      })),
    };
  });
};

const expectedLedger = (f: Filter) => {
  const entries: { type: string; amount: number }[] = [
    ...seed.imports
      .filter((i) => inFilter(i.productionDayId, f))
      .filter((i) => seed.importItems.some((x) => x.importId === i.id))
      .map((i) => ({
        type: "IMPORT",
        amount: -headerTotal(
          seed.importItems.filter((x) => x.importId === i.id),
          i,
        ),
      })),
    ...seed.exports
      .filter((e) => inFilter(e.productionDayId, f))
      .filter((e) => seed.exportItems.some((x) => x.exportId === e.id))
      .map((e) => ({
        type: "EXPORT",
        amount: headerTotal(
          seed.exportItems.filter((x) => x.exportId === e.id),
          e,
        ),
      })),
    ...seed.customerReturns
      .filter((r) => inFilter(r.productionDayId, f))
      .filter((r) =>
        seed.customerReturnItems.some((x) => x.customerReturnId === r.id),
      )
      .map((r) => ({
        type: "CUSTOMER_RETURN",
        amount: -headerTotal(
          seed.customerReturnItems.filter((x) => x.customerReturnId === r.id),
          r,
        ),
      })),
    ...seed.supplierReturns
      .filter((r) => inFilter(r.productionDayId, f))
      .filter((r) =>
        seed.supplierReturnItems.some((x) => x.supplierReturnId === r.id),
      )
      .map((r) => ({
        type: "SUPPLIER_RETURN",
        amount: headerTotal(
          seed.supplierReturnItems.filter((x) => x.supplierReturnId === r.id),
          r,
        ),
      })),
    ...seed.loans
      .filter((l) => inFilter(l.productionDayId, f))
      .map((l) => ({ type: "LOAN", amount: -l.amount.toNumber() })),
    ...seed.loanPayments
      .filter((p) => inFilter(p.productionDayId, f))
      .map((p) => ({ type: "LOAN_PAYMENT", amount: p.amount.toNumber() })),
    ...seed.payments
      .filter((p) => inFilter(p.productionDayId, f))
      .map((p) => ({
        type: "PAYMENT",
        amount: -(
          p.gross.toNumber() -
          p.loans.toNumber() +
          p.loanPayments.toNumber()
        ),
      })),
    ...seed.expenses
      .filter((e) => inFilter(e.productionDayId, f))
      .map((e) => ({ type: "EXPENSE", amount: -e.amount.toNumber() })),
  ];
  const IN = ["EXPORT", "SUPPLIER_RETURN", "LOAN_PAYMENT"];
  const totalIn = round2(
    sum(entries.filter((e) => IN.includes(e.type)).map((e) => e.amount)),
  );
  const totalOut = round2(
    sum(entries.filter((e) => !IN.includes(e.type)).map((e) => e.amount)),
  );
  return {
    totalIn,
    totalOut,
    net: round2(totalIn + totalOut),
    count: entries.length,
  };
};

// ---------- tests ----------
describe("GET reports/production/variants", () => {
  it("returns produced, exported and percentage per product variant", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/production/variants?${query(f)}`);
      expect(res.status).toBe(200);
      expect(sortBy(res.body.data, "variantId")).toEqual(
        sortBy(expectedVariantProduction(f), "variantId").map((e) =>
          expect.objectContaining(e),
        ),
      );
    }
  });
});

describe("GET reports/production/items", () => {
  it("returns produced and exported weight per product item", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/production/items?${query(f)}`);
      expect(res.status).toBe(200);
      expect(sortBy(res.body.data.rows, "itemId")).toEqual(
        sortBy(expectedItemProduction(f), "itemId").map((e) =>
          expect.objectContaining(e),
        ),
      );
    }
  });
});

describe("GET reports/consumption/variants", () => {
  it("returns imported, consumed and percentage per material variant", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/consumption/variants?${query(f)}`);
      expect(res.status).toBe(200);
      expect(sortBy(res.body.data, "variantId")).toEqual(
        sortBy(expectedVariantConsumption(f), "variantId").map((e) =>
          expect.objectContaining(e),
        ),
      );
    }
  });
});

describe("GET reports/consumption/items", () => {
  it("returns imported and consumed weight per material item", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/consumption/items?${query(f)}`);
      expect(res.status).toBe(200);
      expect(sortBy(res.body.data.rows, "itemId")).toEqual(
        sortBy(expectedItemConsumption(f), "itemId").map((e) =>
          expect.objectContaining(e),
        ),
      );
    }
  });
});

describe("GET reports/customers", () => {
  it("returns sales minus returns per customer", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/customers?${query(f)}`);
      expect(res.status).toBe(200);
      const expected = expectedCustomers(f);
      expect(sortBy(res.body.data.rows, "customerId")).toEqual(
        sortBy(expected, "customerId").map((e) => expect.objectContaining(e)),
      );
      expect(res.body.data.totalSold).toBeCloseTo(
        sum(expected.map((e) => e.totalSold)),
        2,
      );
    }
  });
});

describe("GET reports/suppliers", () => {
  it("returns purchases minus returns per supplier", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/suppliers?${query(f)}`);
      expect(res.status).toBe(200);
      const expected = expectedSuppliers(f);
      expect(sortBy(res.body.data.rows, "supplierId")).toEqual(
        sortBy(expected, "supplierId").map((e) => expect.objectContaining(e)),
      );
      expect(res.body.data.totalBought).toBeCloseTo(
        sum(expected.map((e) => e.totalBought)),
        2,
      );
    }
  });
});

describe("GET reports/rates", () => {
  it("returns days, amounts and paid state per overlapping rate", async () => {
    const filters: Filter[] = [
      {},
      { from: dayDate(0), to: dayDate(0) },
      { from: dayDate(1), to: dayDate(2) },
    ];
    for (const f of filters) {
      const res = await auth().get(`/reports/rates?${query(f)}`);
      expect(res.status).toBe(200);
      const expected = expectedRates(f);
      expect(sortBy(res.body.data.rows, "rateId")).toEqual(
        sortBy(expected, "rateId").map((e) => expect.objectContaining(e)),
      );
      expect(res.body.data.totalNet).toBeCloseTo(
        sum(expected.map((e) => e.net)),
        2,
      );
    }
  });
});

describe("GET reports/attendance", () => {
  it("returns each laborer's factors per week with totals", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/attendance?${query(f)}`);
      expect(res.status).toBe(200);
      const expected = sortBy(expectedAttendance(f), "laborerId");
      expect(sortBy(res.body.data, "laborerId")).toEqual(
        expected.map((e) =>
          expect.objectContaining({
            laborerId: e.laborerId,
            total: e.total,
            weeks: e.weeks.map((w) => expect.objectContaining(w)),
          }),
        ),
      );
    }
  });
});

describe("GET reports/ledger", () => {
  it("returns money in, money out, net and the number of entries", async () => {
    for (const f of filtersOf()) {
      const res = await auth().get(`/reports/ledger?${query(f)}`);
      expect(res.status).toBe(200);
      const e = expectedLedger(f);
      expect(res.body.data.totalIn).toBeCloseTo(e.totalIn, 2);
      expect(res.body.data.totalOut).toBeCloseTo(e.totalOut, 2);
      expect(res.body.data.net).toBeCloseTo(e.net, 2);
      expect(res.body.data.entries.length).toBe(e.count);
    }
  });
});
afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});
