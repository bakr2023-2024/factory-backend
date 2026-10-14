import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";
import { signToken } from "../src/utils/security/token.security";
import {
  ItemType,
  PaymentType,
  Role,
  StockMovementType,
} from "../src/db/generated/prisma/enums";
import {
  Attendance,
  Consumption,
  Customer,
  CustomerReturn,
  CustomerReturnItem,
  Export,
  ExportItem,
  Import,
  ImportItem,
  Item,
  Laborer,
  Loan,
  LoanPayment,
  Payment,
  Prisma,
  ProductionBatch,
  ProductionDay,
  ProductionEntry,
  Rate,
  Season,
  StockMovement,
  Supplier,
  SupplierReturn,
  SupplierReturnItem,
  Variant,
  Week,
} from "../src/db/generated/prisma/client";

let token = "";
export const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

export const login = async () => {
  const admin =
    (await prisma.user.findFirst({ where: { username: "test_admin" } })) ??
    (await prisma.user.create({
      data: {
        username: "test_admin",
        number: "987654321",
        password: "123xyzXYZ",
        role: Role.ADMIN,
      },
    }));

  token = signToken({ sub: admin.id.toString() });
};
export const auth = () => {
  const bearer = `Bearer ${token}`;
  return {
    get: (url: string) => request(app).get(url).set("Authorization", bearer),
    post: (url: string) => request(app).post(url).set("Authorization", bearer),
    patch: (url: string) =>
      request(app).patch(url).set("Authorization", bearer),
    delete: (url: string) =>
      request(app).delete(url).set("Authorization", bearer),
  };
};
export const cleanDatabase = async () => {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${Object.values(Prisma.ModelName)
      .map((t) => `"${t}"`)
      .join(",")} RESTART IDENTITY CASCADE;`,
  );
};

// ---------- helpers ----------
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// Fixed dates (never derived from "now"), one per day at 12:00 UTC.
// Imports use at(0..2), exports at(3..5), customer returns at(6..8),
// supplier returns at(9..11), so no two documents share a timestamp.
const at = (n: number) => new Date(Date.UTC(2026, 8, 24, 12) + n * DAY);
// same date plus idx minutes: keeps stock movements' timestamps unique
const shift = (d: Date, idx: number) => new Date(d.getTime() + idx * 60_000);
// a given hour (UTC) on a production day
const onDay = (d: ProductionDay, hour: number) =>
  new Date(d.productionDate.getTime() + hour * HOUR);
const byId = <T extends { id: number }>(rows: T[], id: number) =>
  rows.find((r) => r.id === id)!;

// ---------- mock data ----------
const mockItems = [
  { name: "Fruit Tofu", type: ItemType.PRODUCT },
  { name: "Coffee Tofu", type: ItemType.PRODUCT },
  { name: "Honey Barrel", type: ItemType.MATERIAL },
];
const mockCustomers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
];
const mockSuppliers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
];
const mockLaborers = [
  { name: "laborer 1", number: "07775000" },
  { name: "laborer 2", number: "08886000" },
  { name: "laborer 3", number: "09997000" },
];
// Laborer i has rate i, in season i, and works on production day i.
const mockRates = [
  { dailySalary: 600, paymentType: PaymentType.WEEKLY },
  { dailySalary: 1000, paymentType: PaymentType.MONTHLY },
  { dailySalary: 2000, paymentType: PaymentType.SEASON_END },
];
// Factor and hours per laborer on their production day.
const mockAttendances = [
  { factor: 1, leftHour: 17 },
  { factor: 0.5, leftHour: 12 },
  { factor: 1, leftHour: 17 },
];
// Variants 0 and 2 share unitWeight 5 (different items), and item 0 has two
// variants, so itemName + unitWeight filters can be told apart from either alone.
// Variants 0..2 are used by the main rows, variant 3 only by the "free" rows.
const mockVariants = [
  { itemIdx: 0, unitWeight: 5 },
  { itemIdx: 0, unitWeight: 7 },
  { itemIdx: 1, unitWeight: 5 },
  { itemIdx: 2, unitWeight: 3 },
];
const mockSeasons = [
  { name: "season 1", startDate: new Date("2026-09-24T00:00:00Z") },
  { name: "season 2", startDate: new Date("2026-10-01T00:00:00Z") },
  { name: "season 3", startDate: new Date("2026-10-08T00:00:00Z") },
];
const mockWeeks = [
  { startDate: new Date("2026-09-24T00:00:00Z") },
  { startDate: new Date("2026-10-01T00:00:00Z") },
  { startDate: new Date("2026-10-08T00:00:00Z") },
];
const mockProductionDays = [
  {
    productionDate: new Date("2026-09-24T00:00:00Z"),
    startedAt: new Date("2026-09-24T08:00:00Z"),
  },
  {
    productionDate: new Date("2026-10-01T00:00:00Z"),
    startedAt: new Date("2026-10-01T08:00:00Z"),
  },
  {
    productionDate: new Date("2026-10-08T00:00:00Z"),
    startedAt: new Date("2026-10-08T08:00:00Z"),
  },
];

export type MockData = {
  items: Item[];
  seasons: Season[];
  customers: Customer[];
  suppliers: Supplier[];
  variants: Variant[];
  weeks: Week[];
  productionDays: ProductionDay[];
  productionEntries: ProductionEntry[];
  productionBatches: ProductionBatch[];
  imports: Import[];
  importItems: ImportItem[];
  exports: Export[];
  exportItems: ExportItem[];
  customerReturns: CustomerReturn[];
  customerReturnItems: CustomerReturnItem[];
  supplierReturns: SupplierReturn[];
  supplierReturnItems: SupplierReturnItem[];
  consumptions: Consumption[];
  stockMovements: StockMovement[];
  laborers: Laborer[];
  rates: Rate[];
  attendances: Attendance[];
  payments: Payment[];
  loans: Loan[];
  loanPayments: LoanPayment[];
};

export const populateDatabase = async (): Promise<MockData> => {
  const stockMovements: StockMovement[] = [];

  const items: Item[] = await prisma.item.createManyAndReturn({
    data: mockItems,
  });
  const seasons: Season[] = await prisma.season.createManyAndReturn({
    data: mockSeasons,
  });

  const customers: Customer[] = await prisma.customer.createManyAndReturn({
    data: mockCustomers,
  });
  const suppliers: Supplier[] = await prisma.supplier.createManyAndReturn({
    data: mockSuppliers,
  });
  const laborers: Laborer[] = await prisma.laborer.createManyAndReturn({
    data: mockLaborers,
  });
  const variants: Variant[] = await prisma.variant.createManyAndReturn({
    data: mockVariants.map((v) => ({
      itemId: items[v.itemIdx].id,
      unitWeight: v.unitWeight,
    })),
  });
  const weeks: Week[] = await prisma.week.createManyAndReturn({
    data: seasons.map((s, idx) => ({ ...mockWeeks[idx], seasonId: s.id })),
  });
  const productionDays: ProductionDay[] =
    await prisma.productionDay.createManyAndReturn({
      data: weeks.map((w, idx) => ({
        ...mockProductionDays[idx],
        weekId: w.id,
      })),
    });
  const productionEntries: ProductionEntry[] =
    await prisma.productionEntry.createManyAndReturn({
      data: productionDays.map((d, idx) => ({
        variantId: variants[idx].id,
        productionDayId: d.id,
      })),
    });
  // batches and consumptions are dated ON their production day
  // (09:00+idx for batches, 10:00+idx for consumptions)
  const productionBatches: ProductionBatch[] =
    await prisma.productionBatch.createManyAndReturn({
      data: productionEntries.map((e, idx) => ({
        quantity: 20 * (idx + 1),
        productionEntryId: e.id,
        occurredAt: new Date(
          byId(productionDays, e.productionDayId).productionDate.getTime() +
            (9 + idx) * HOUR,
        ),
      })),
    });
  stockMovements.push(
    ...(await prisma.stockMovement.createManyAndReturn({
      data: productionBatches.map((b) => ({
        variantId: byId(productionEntries, b.productionEntryId).variantId,
        productionDayId: byId(productionEntries, b.productionEntryId)
          .productionDayId,
        quantityChanged: b.quantity,
        type: StockMovementType.PRODUCTION_BATCH,
        typeRef: b.id,
        occurredAt: b.occurredAt,
      })),
    })),
  );
  const imports: Import[] = await prisma.import.createManyAndReturn({
    data: suppliers.map((s, idx) => ({
      supplierId: s.id,
      productionDayId: productionDays[idx].id,
      occurredAt: at(idx),
    })),
  });
  // importItems[0..2] are returned by supplierReturnItems below;
  // importItems[3..4] are left free for POST tests
  const importItems: ImportItem[] = await prisma.importItem.createManyAndReturn(
    {
      data: [
        ...imports.map((i, idx) => ({
          importId: i.id,
          variantId: variants[idx].id,
          quantity: (idx + 1) * 10,
          unitPrice: (idx + 1) * 2,
        })),
        {
          importId: imports[0].id,
          variantId: variants[3].id,
          quantity: 4,
          unitPrice: 8,
        },
        {
          importId: imports[1].id,
          variantId: variants[3].id,
          quantity: 6,
          unitPrice: 10,
        },
      ],
    },
  );
  stockMovements.push(
    ...(await prisma.stockMovement.createManyAndReturn({
      data: importItems.map((b, idx) => ({
        variantId: b.variantId,
        productionDayId: byId(imports, b.importId).productionDayId,
        quantityChanged: b.quantity,
        type: StockMovementType.IMPORT_ITEM,
        typeRef: b.id,
        occurredAt: shift(byId(imports, b.importId).occurredAt, idx),
      })),
    })),
  );
  const exports: Export[] = await prisma.export.createManyAndReturn({
    data: customers.map((c, idx) => ({
      customerId: c.id,
      productionDayId: productionDays[idx].id,
      occurredAt: at(idx + 3),
    })),
  });
  // exportItems[0..2] are returned by customerReturnItems below;
  // exportItems[3..4] are left free for POST tests
  const exportItems: ExportItem[] = await prisma.exportItem.createManyAndReturn(
    {
      data: [
        ...exports.map((e, idx) => ({
          exportId: e.id,
          variantId: variants[idx].id,
          quantity: (idx + 1) * 10,
          unitPrice: (idx + 1) * 3,
        })),
        {
          exportId: exports[0].id,
          variantId: variants[3].id,
          quantity: 5,
          unitPrice: 12,
        },
        {
          exportId: exports[1].id,
          variantId: variants[3].id,
          quantity: 7,
          unitPrice: 15,
        },
      ],
    },
  );
  stockMovements.push(
    ...(await prisma.stockMovement.createManyAndReturn({
      data: exportItems.map((b, idx) => ({
        variantId: b.variantId,
        productionDayId: byId(exports, b.exportId).productionDayId,
        quantityChanged: -b.quantity,
        type: StockMovementType.EXPORT_ITEM,
        typeRef: b.id,
        occurredAt: shift(byId(exports, b.exportId).occurredAt, idx),
      })),
    })),
  );
  const customerReturns: CustomerReturn[] =
    await prisma.customerReturn.createManyAndReturn({
      data: customers.map((c, idx) => ({
        customerId: c.id,
        productionDayId: productionDays[idx].id,
        occurredAt: at(idx + 6),
      })),
    });
  const customerReturnItems: CustomerReturnItem[] =
    await prisma.customerReturnItem.createManyAndReturn({
      data: customerReturns.map((r, idx) => ({
        customerReturnId: r.id,
        exportItemId: exportItems[idx].id,
        quantity: 3 * (idx + 1),
        unitPrice: (idx + 1) * 1.5,
      })),
    });
  stockMovements.push(
    ...(await prisma.stockMovement.createManyAndReturn({
      data: customerReturnItems.map((b, idx) => ({
        variantId: byId(exportItems, b.exportItemId).variantId,
        productionDayId: byId(customerReturns, b.customerReturnId)
          .productionDayId,
        quantityChanged: b.quantity,
        type: StockMovementType.CUSTOMER_RETURN_ITEM,
        typeRef: b.id,
        occurredAt: shift(
          byId(customerReturns, b.customerReturnId).occurredAt,
          idx,
        ),
      })),
    })),
  );
  const supplierReturns: SupplierReturn[] =
    await prisma.supplierReturn.createManyAndReturn({
      data: suppliers.map((s, idx) => ({
        supplierId: s.id,
        productionDayId: productionDays[idx].id,
        occurredAt: at(idx + 9),
      })),
    });
  const supplierReturnItems: SupplierReturnItem[] =
    await prisma.supplierReturnItem.createManyAndReturn({
      data: supplierReturns.map((r, idx) => ({
        supplierReturnId: r.id,
        importItemId: importItems[idx].id,
        quantity: 2 * (idx + 1),
        unitPrice: (idx + 1) * 1.5,
      })),
    });
  stockMovements.push(
    ...(await prisma.stockMovement.createManyAndReturn({
      data: supplierReturnItems.map((b, idx) => ({
        variantId: byId(importItems, b.importItemId).variantId,
        productionDayId: byId(supplierReturns, b.supplierReturnId)
          .productionDayId,
        quantityChanged: -b.quantity,
        type: StockMovementType.SUPPLIER_RETURN_ITEM,
        typeRef: b.id,
        occurredAt: shift(
          byId(supplierReturns, b.supplierReturnId).occurredAt,
          idx,
        ),
      })),
    })),
  );
  const consumptions: Consumption[] =
    await prisma.consumption.createManyAndReturn({
      data: productionDays.map((d, idx) => ({
        productionDayId: d.id,
        variantId: variants[idx].id,
        quantity: 5 * (idx + 1),
        occurredAt: new Date(d.productionDate.getTime() + (10 + idx) * HOUR),
      })),
    });
  stockMovements.push(
    ...(await prisma.stockMovement.createManyAndReturn({
      data: consumptions.map((b) => ({
        variantId: b.variantId,
        productionDayId: b.productionDayId,
        quantityChanged: -b.quantity,
        type: StockMovementType.CONSUMPTION,
        typeRef: b.id,
        occurredAt: b.occurredAt,
      })),
    })),
  );

  // ---------- laborers ----------
  const rates: Rate[] = await prisma.rate.createManyAndReturn({
    data: laborers.map((l, idx) => ({
      laborerId: l.id,
      seasonId: seasons[idx].id,
      dailySalary: mockRates[idx].dailySalary,
      paymentType: mockRates[idx].paymentType,
      from: seasons[idx].startDate,
      to: null,
    })),
  });
  const attendances: Attendance[] = await prisma.attendance.createManyAndReturn(
    {
      data: laborers.map((l, idx) => ({
        laborerId: l.id,
        productionDayId: productionDays[idx].id,
        cameAt: onDay(productionDays[idx], 8),
        leftAt: onDay(productionDays[idx], mockAttendances[idx].leftHour),
        factor: mockAttendances[idx].factor,
      })),
    },
  );
  // Gross = sum of factors x dailySalary. Net = gross - loans + loanPayments.
  // Payment 0: gross 1 x 600 = 600, loans 300, loanPayments 100 => net 400.
  // Payment 1: gross 1 x 2000 = 2000, loans 1000, loanPayments 0 => net 1000.
  // Laborer 1 has no payment yet (their 0.5 x 1000 is still pending).
  const payments: Payment[] = await prisma.payment.createManyAndReturn({
    data: [
      {
        rateId: rates[0].id,
        gross: 600,
        loans: 300,
        loanPayments: 100,
        net: 400,
        paidAt: onDay(productionDays[0], 18),
      },
      {
        rateId: rates[2].id,
        gross: 2000,
        loans: 1000,
        loanPayments: 0,
        net: 1000,
        paidAt: onDay(productionDays[2], 18),
      },
    ],
  });
  // loan 0 and loan 2 were deducted in payments 0 and 1; loan 1 is still open
  const loans: Loan[] = await prisma.loan.createManyAndReturn({
    data: [
      {
        laborerId: laborers[0].id,
        seasonId: seasons[0].id,
        loanAmount: 300,
        loanedAt: onDay(productionDays[0], 7),
        paymentId: payments[0].id,
      },
      {
        laborerId: laborers[1].id,
        seasonId: seasons[1].id,
        loanAmount: 500,
        loanedAt: onDay(productionDays[1], 7),
        paymentId: null,
      },
      {
        laborerId: laborers[2].id,
        seasonId: seasons[2].id,
        loanAmount: 1000,
        loanedAt: onDay(productionDays[2], 7),
        paymentId: payments[1].id,
      },
    ],
  });
  // loanPayment 0 was deducted in payment 0; loanPayment 1 is free for POST tests
  const loanPayments: LoanPayment[] =
    await prisma.loanPayment.createManyAndReturn({
      data: [
        {
          loanId: loans[0].id,
          paymentId: payments[0].id,
          amount: 100,
          repaidAt: onDay(productionDays[0], 17),
        },
        {
          loanId: loans[1].id,
          paymentId: null,
          amount: 50,
          repaidAt: onDay(productionDays[1], 16),
        },
      ],
    });

  return {
    items,
    seasons,
    customers,
    suppliers,
    variants,
    weeks,
    productionDays,
    productionEntries,
    productionBatches,
    exports,
    exportItems,
    imports,
    importItems,
    customerReturns,
    customerReturnItems,
    supplierReturns,
    supplierReturnItems,
    consumptions,
    stockMovements,
    laborers,
    rates,
    attendances,
    payments,
    loans,
    loanPayments,
  };
};