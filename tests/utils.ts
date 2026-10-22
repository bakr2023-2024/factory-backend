import request from "supertest";
import app from "../src/app";
import prisma from "../src/db/prisma";
import { signToken } from "../src/utils/security/token.security";
import {
  ExpenseType,
  ItemType,
  PaymentType,
  Role,
  StockMovementType,
  StorageType,
} from "../src/db/generated/prisma/enums";
import {
  Attendance,
  Consumption,
  Customer,
  CustomerReturn,
  CustomerReturnItem,
  Expense,
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
  { name: "Spare Item", type: ItemType.PRODUCT }, // free: no variants
];
const mockCustomers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
  { name: "new customer", number: "01234567890" }, // free: no children
];
const mockSuppliers = [
  { name: "john cena", number: "07775000" },
  { name: "cm punk", number: "08886000" },
  { name: "brock lesner", number: "09997000" },
  { name: "new supplier", number: "01234567890" }, // free: no children
];
const mockLaborers = [
  { name: "laborer 1", number: "07775000" },
  { name: "laborer 2", number: "08886000" },
  { name: "laborer 3", number: "09997000" },
  { name: "laborer 4", number: "06660000" }, // free: no rates
];
// Variants 0..3 are used. Variant 4 is free (item 0, no children).
const mockVariants = [
  { itemIdx: 0, unitWeight: 5, type: StorageType.BAG },
  { itemIdx: 0, unitWeight: 7, type: StorageType.BOX },
  { itemIdx: 1, unitWeight: 5, type: StorageType.BASKET },
  { itemIdx: 2, unitWeight: 3, type: StorageType.BOX },
  { itemIdx: 0, unitWeight: 9, type: StorageType.JAR },
];
const mockSeasons = [
  {
    name: "season 1",
    startDate: new Date("2026-09-24T00:00:00Z"),
    endDate: new Date("2026-10-01T00:00:00Z"),
  },
  {
    name: "season 2",
    startDate: new Date("2026-10-01T00:00:00Z"),
    endDate: new Date("2026-10-08T00:00:00Z"),
  },
  {
    name: "season 3",
    startDate: new Date("2026-10-08T00:00:00Z"),
    endDate: new Date("2026-10-15T00:00:00Z"),
  },
  {
    name: "season 4",
    startDate: new Date("2026-10-15T00:00:00Z"),
    endDate: new Date("2026-10-22T00:00:00Z"),
  }, // free: no weeks
];
const mockWeeks = [
  {
    seasonIdx: 0,
    startDate: new Date("2026-09-24T00:00:00Z"),
    endDate: new Date("2026-10-01T00:00:00Z"),
  },
  {
    seasonIdx: 1,
    startDate: new Date("2026-10-01T00:00:00Z"),
    endDate: new Date("2026-10-08T00:00:00Z"),
  },
  {
    seasonIdx: 2,
    startDate: new Date("2026-10-08T00:00:00Z"),
    endDate: new Date("2026-10-15T00:00:00Z"),
  },
  {
    seasonIdx: 1,
    startDate: new Date("2026-10-15T00:00:00Z"),
    endDate: new Date("2026-10-22T00:00:00Z"),
  }, // free: no days
];
const mockProductionDays = [
  {
    weekIdx: 0,
    productionDate: new Date("2026-09-24T00:00:00Z"),
    startedAt: new Date("2026-09-24T08:00:00Z"),
    endedAt: new Date("2026-09-24T17:00:00Z"),
  },
  {
    weekIdx: 1,
    productionDate: new Date("2026-10-01T00:00:00Z"),
    startedAt: new Date("2026-10-01T08:00:00Z"),
    endedAt: new Date("2026-10-01T17:00:00Z"),
  },
  {
    weekIdx: 2,
    productionDate: new Date("2026-10-08T00:00:00Z"),
    startedAt: new Date("2026-10-08T08:00:00Z"),
    endedAt: new Date("2026-10-08T17:00:00Z"),
  },
  {
    weekIdx: 0,
    productionDate: new Date("2026-09-25T00:00:00Z"),
    startedAt: new Date("2026-09-25T08:00:00Z"),
    endedAt: new Date("2026-09-25T17:00:00Z"),
  }, // free: no children
];
const mockRates = [
  {
    laborerIdx: 0,
    seasonIdx: 0,
    dailySalary: 600,
    paymentType: PaymentType.WEEKLY,
  }, // used, paid
  {
    laborerIdx: 1,
    seasonIdx: 1,
    dailySalary: 1000,
    paymentType: PaymentType.MONTHLY,
  }, // used, unpaid
  {
    laborerIdx: 2,
    seasonIdx: 2,
    dailySalary: 2000,
    paymentType: PaymentType.SEASON_END,
  }, // used, paid
  {
    laborerIdx: 0,
    seasonIdx: 0,
    dailySalary: 700,
    paymentType: PaymentType.WEEKLY,
  }, // free, no children
  {
    laborerIdx: 1,
    seasonIdx: 1,
    dailySalary: 500,
    paymentType: PaymentType.MONTHLY,
  }, // free, paid by payment 2
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
  expenses: Expense[];
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
    data: mockWeeks.map((w) => ({
      startDate: w.startDate,
      endDate: w.endDate,
      seasonId: seasons[w.seasonIdx].id,
    })),
  });
  const productionDays: ProductionDay[] =
    await prisma.productionDay.createManyAndReturn({
      data: mockProductionDays.map((d) => ({
        productionDate: d.productionDate,
        startedAt: d.startedAt,
        endedAt: d.endedAt,
        weekId: weeks[d.weekIdx].id,
      })),
    });

  // Entries 0..3 are used (entry 3 has batch 3). Entry 4 is free (no batch).
  const productionEntries: ProductionEntry[] =
    await prisma.productionEntry.createManyAndReturn({
      data: [
        { productionDayId: productionDays[0].id, variantId: variants[0].id },
        { productionDayId: productionDays[1].id, variantId: variants[1].id },
        { productionDayId: productionDays[2].id, variantId: variants[2].id },
        { productionDayId: productionDays[0].id, variantId: variants[3].id },
        { productionDayId: productionDays[1].id, variantId: variants[3].id },
      ],
    });
  // Batches 0..2 are used by the rows above. Batch 3 is free.
  const productionBatches: ProductionBatch[] =
    await prisma.productionBatch.createManyAndReturn({
      data: productionEntries.slice(0, 4).map((e, idx) => ({
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

  // Imports 0..2 are used. Import 3 is free (supplier 1, no items).
  const imports: Import[] = await prisma.import.createManyAndReturn({
    data: [
      {
        supplierId: suppliers[0].id,
        productionDayId: productionDays[0].id,
        occurredAt: at(0),
      },
      {
        supplierId: suppliers[1].id,
        productionDayId: productionDays[1].id,
        occurredAt: at(1),
      },
      {
        supplierId: suppliers[2].id,
        productionDayId: productionDays[2].id,
        occurredAt: at(2),
      },
      {
        supplierId: suppliers[1].id,
        productionDayId: productionDays[1].id,
        occurredAt: onDay(productionDays[1], 9),
      },
    ],
  });
  // ImportItems 0..2 are returned by supplier return items 0..2.
  // ImportItems 3 and 4 are free. ImportItem 5 is returned by supplier return item 3.
  const importItems: ImportItem[] = await prisma.importItem.createManyAndReturn(
    {
      data: [
        {
          importId: imports[0].id,
          variantId: variants[0].id,
          quantity: 10,
          unitPrice: 2,
        },
        {
          importId: imports[1].id,
          variantId: variants[1].id,
          quantity: 20,
          unitPrice: 4,
        },
        {
          importId: imports[2].id,
          variantId: variants[2].id,
          quantity: 30,
          unitPrice: 6,
        },
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
        {
          importId: imports[2].id,
          variantId: variants[3].id,
          quantity: 3,
          unitPrice: 5,
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

  // Exports 0..2 are used. Export 3 is free (customer 1, no items).
  const exports: Export[] = await prisma.export.createManyAndReturn({
    data: [
      {
        customerId: customers[0].id,
        productionDayId: productionDays[0].id,
        occurredAt: at(3),
      },
      {
        customerId: customers[1].id,
        productionDayId: productionDays[1].id,
        occurredAt: at(4),
      },
      {
        customerId: customers[2].id,
        productionDayId: productionDays[2].id,
        occurredAt: at(5),
      },
      {
        customerId: customers[1].id,
        productionDayId: productionDays[1].id,
        occurredAt: onDay(productionDays[1], 9),
      },
    ],
  });
  // ExportItems 0..2 are returned by customer return items 0..2.
  // ExportItems 3 and 4 are free. ExportItem 5 is returned by customer return item 3.
  const exportItems: ExportItem[] = await prisma.exportItem.createManyAndReturn(
    {
      data: [
        {
          exportId: exports[0].id,
          variantId: variants[0].id,
          quantity: 10,
          unitPrice: 3,
        },
        {
          exportId: exports[1].id,
          variantId: variants[1].id,
          quantity: 20,
          unitPrice: 6,
        },
        {
          exportId: exports[2].id,
          variantId: variants[2].id,
          quantity: 30,
          unitPrice: 9,
        },
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
        {
          exportId: exports[2].id,
          variantId: variants[3].id,
          quantity: 3,
          unitPrice: 9,
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

  // Customer returns 0..2 are used. Return 3 is free (customer 2, no items).
  const customerReturns: CustomerReturn[] =
    await prisma.customerReturn.createManyAndReturn({
      data: [
        {
          customerId: customers[0].id,
          productionDayId: productionDays[0].id,
          occurredAt: at(6),
        },
        {
          customerId: customers[1].id,
          productionDayId: productionDays[1].id,
          occurredAt: at(7),
        },
        {
          customerId: customers[2].id,
          productionDayId: productionDays[2].id,
          occurredAt: at(8),
        },
        {
          customerId: customers[2].id,
          productionDayId: productionDays[2].id,
          occurredAt: onDay(productionDays[2], 9),
        },
      ],
    });
  // Return items 0..2 point at export items 0..2. Return item 3 points at
  // export item 5, on customer return 2 (the same customer as export 2).
  const customerReturnItems: CustomerReturnItem[] =
    await prisma.customerReturnItem.createManyAndReturn({
      data: [
        {
          customerReturnId: customerReturns[0].id,
          exportItemId: exportItems[0].id,
          quantity: 3,
          unitPrice: 1.5,
        },
        {
          customerReturnId: customerReturns[1].id,
          exportItemId: exportItems[1].id,
          quantity: 6,
          unitPrice: 3,
        },
        {
          customerReturnId: customerReturns[2].id,
          exportItemId: exportItems[2].id,
          quantity: 9,
          unitPrice: 4.5,
        },
        {
          customerReturnId: customerReturns[2].id,
          exportItemId: exportItems[5].id,
          quantity: 2,
          unitPrice: 3,
        },
      ],
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

  // Supplier returns 0..2 are used. Return 3 is free (supplier 2, no items).
  const supplierReturns: SupplierReturn[] =
    await prisma.supplierReturn.createManyAndReturn({
      data: [
        {
          supplierId: suppliers[0].id,
          productionDayId: productionDays[0].id,
          occurredAt: at(9),
        },
        {
          supplierId: suppliers[1].id,
          productionDayId: productionDays[1].id,
          occurredAt: at(10),
        },
        {
          supplierId: suppliers[2].id,
          productionDayId: productionDays[2].id,
          occurredAt: at(11),
        },
        {
          supplierId: suppliers[2].id,
          productionDayId: productionDays[2].id,
          occurredAt: onDay(productionDays[2], 9),
        },
      ],
    });
  // Return items 0..2 point at import items 0..2. Return item 3 points at
  // import item 5, on supplier return 2 (the same supplier as import 2).
  const supplierReturnItems: SupplierReturnItem[] =
    await prisma.supplierReturnItem.createManyAndReturn({
      data: [
        {
          supplierReturnId: supplierReturns[0].id,
          importItemId: importItems[0].id,
          quantity: 2,
          unitPrice: 1.5,
        },
        {
          supplierReturnId: supplierReturns[1].id,
          importItemId: importItems[1].id,
          quantity: 4,
          unitPrice: 3,
        },
        {
          supplierReturnId: supplierReturns[2].id,
          importItemId: importItems[2].id,
          quantity: 6,
          unitPrice: 4.5,
        },
        {
          supplierReturnId: supplierReturns[2].id,
          importItemId: importItems[5].id,
          quantity: 2,
          unitPrice: 3,
        },
      ],
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

  // Consumptions 0..2 are dated on days 0..2. Consumption 3 is free (day 1, variant 3).
  const consumptions: Consumption[] =
    await prisma.consumption.createManyAndReturn({
      data: [
        ...productionDays.slice(0, 3).map((d, idx) => ({
          productionDayId: d.id,
          variantId: variants[idx].id,
          quantity: 5 * (idx + 1),
          occurredAt: new Date(d.productionDate.getTime() + (10 + idx) * HOUR),
        })),
        {
          productionDayId: productionDays[1].id,
          variantId: variants[3].id,
          quantity: 4,
          occurredAt: onDay(productionDays[1], 11),
        },
      ],
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
    data: mockRates.map((r) => ({
      laborerId: laborers[r.laborerIdx].id,
      seasonId: seasons[r.seasonIdx].id,
      dailySalary: r.dailySalary,
      paymentType: r.paymentType,
      from: seasons[r.seasonIdx].startDate,
      to: seasons[r.seasonIdx].endDate,
    })),
  });

  // Attendances 0 and 1 belong to paid rates (locked). 2 and 3 are free (rate 1, unpaid).
  const attendances: Attendance[] = await prisma.attendance.createManyAndReturn(
    {
      data: [
        {
          rateId: rates[0].id,
          productionDayId: productionDays[0].id,
          cameAt: onDay(productionDays[0], 8),
          leftAt: onDay(productionDays[0], 17),
          factor: 1,
        },
        {
          rateId: rates[2].id,
          productionDayId: productionDays[2].id,
          cameAt: onDay(productionDays[2], 8),
          leftAt: onDay(productionDays[2], 17),
          factor: 1,
        },
        {
          rateId: rates[1].id,
          productionDayId: productionDays[1].id,
          cameAt: onDay(productionDays[1], 8),
          leftAt: onDay(productionDays[1], 12),
          factor: 0.5,
        },
        {
          rateId: rates[1].id,
          productionDayId: productionDays[0].id,
          cameAt: onDay(productionDays[0], 13),
          leftAt: onDay(productionDays[0], 17),
          factor: 0.5,
        },
      ],
    },
  );

  // Loans 0 and 1 belong to paid rates (locked). 2 and 3 are free (rate 1).
  const loans: Loan[] = await prisma.loan.createManyAndReturn({
    data: [
      {
        rateId: rates[0].id,
        productionDayId: productionDays[0].id,
        amount: 300,
        occurredAt: onDay(productionDays[0], 7),
      },
      {
        rateId: rates[2].id,
        productionDayId: productionDays[2].id,
        amount: 1000,
        occurredAt: onDay(productionDays[2], 7),
      },
      {
        rateId: rates[1].id,
        productionDayId: productionDays[1].id,
        amount: 300,
        occurredAt: onDay(productionDays[1], 7),
      },
      {
        rateId: rates[1].id,
        productionDayId: productionDays[1].id,
        amount: 200,
        occurredAt: onDay(productionDays[1], 8),
      },
    ],
  });

  // Loan payments 0 and 1 belong to a paid rate (locked, totalling 100).
  // 2 and 3 are free (rate 1).
  const loanPayments: LoanPayment[] =
    await prisma.loanPayment.createManyAndReturn({
      data: [
        {
          rateId: rates[0].id,
          productionDayId: productionDays[0].id,
          amount: 60,
          occurredAt: onDay(productionDays[0], 17),
        },
        {
          rateId: rates[0].id,
          productionDayId: productionDays[0].id,
          amount: 40,
          occurredAt: onDay(productionDays[0], 16),
        },
        {
          rateId: rates[1].id,
          productionDayId: productionDays[1].id,
          amount: 30,
          occurredAt: onDay(productionDays[1], 16),
        },
        {
          rateId: rates[1].id,
          productionDayId: productionDays[1].id,
          amount: 20,
          occurredAt: onDay(productionDays[1], 15),
        },
      ],
    });

  // Payments 0 and 1 are used. Payment 2 is free: it can be deleted, since
  // nothing references it, and it locks rate 4 only.
  const payments: Payment[] = await prisma.payment.createManyAndReturn({
    data: [
      {
        rateId: rates[0].id,
        productionDayId: productionDays[0].id,
        gross: 600,
        loans: 300,
        loanPayments: 100,
        net: 400,
        occurredAt: onDay(productionDays[0], 18),
      },
      {
        rateId: rates[2].id,
        productionDayId: productionDays[2].id,
        gross: 2000,
        loans: 1000,
        loanPayments: 0,
        net: 1000,
        occurredAt: onDay(productionDays[2], 18),
      },
      {
        rateId: rates[4].id,
        productionDayId: productionDays[1].id,
        gross: 0,
        loans: 0,
        loanPayments: 0,
        net: 0,
        occurredAt: onDay(productionDays[1], 18),
      },
    ],
  });
  const expenses: Expense[] = await prisma.expense.createManyAndReturn({
    data: [
      {
        productionDayId: productionDays[0].id,
        amount: 300,
        type: ExpenseType.BILLS,
        occurredAt: onDay(productionDays[0], 7),
      },
      {
        productionDayId: productionDays[2].id,
        amount: 1000,
        type: ExpenseType.REPAIRS,
        occurredAt: onDay(productionDays[2], 7),
      },
      {
        productionDayId: productionDays[1].id,
        amount: 300,
        type: ExpenseType.SUNDRIES,
        occurredAt: onDay(productionDays[1], 7),
      },
      {
        productionDayId: productionDays[1].id,
        amount: 200,
        type: ExpenseType.SUNDRIES,
        occurredAt: onDay(productionDays[1], 8),
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
    expenses,
  };
};
