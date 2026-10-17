import {
  Export,
  ExportItem,
  Import,
  ImportItem,
  Item,
  ItemType,
  PaymentType,
  Prisma,
  ProductionBatch,
  ProductionDay,
  Season,
  StockMovement,
  StockMovementType,
  Variant,
  Week,
} from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import { NotFoundException } from "../../utils/exceptions";
import { getSheetParamsDTO, getSummaryQueryDTO } from "./report.validation";
type VariantWithItem = Variant & { item: Item };

type ProductionRow = {
  entryId: number;
  variant: VariantWithItem;
  batches: ProductionBatch[];
  totalQuantity: number;
  totalWeight: number;
};
type VariantProductionSummary = {
  variantId: number;
  itemName: string;
  unitWeight: number;
  totalProduced: number;
  totalExported: number;
  percentage: number;
};
type ItemProductionSummary = {
  itemId: number;
  itemName: string;
  totalProducedWeight: number;
  totalExportedWeight: number;
  percentage: number;
};
type VariantConsumptionSummary = {
  variantId: number;
  itemName: string;
  unitWeight: number;
  totalImported: number;
  totalConsumed: number;
  percentage: number;
};
type ItemConsumptionSummary = {
  itemId: number;
  itemName: string;
  totalImportedWeight: number;
  totalConsumedWeight: number;
  percentage: number;
};
type CustomerSummary = {
  customerId: number;
  customerName: string;
  customerNumber: string | null;
  transactions: number;
  totalSold: number;
  averageTransaction: number;
};
type SupplierSummary = {
  supplierId: number;
  supplierName: string;
  supplierNumber: string | null;
  transactions: number;
  totalBought: number;
  averageTransaction: number;
};
type Inventory = {
  variant: VariantWithItem;
  openingBalance: number;
  changes: StockMovement[];
  changeAmount: number;
  closingBalance: number;
};
export type ProductionDaySheet = {
  productionDay: ProductionDay;
  week: Week;
  season: Season;
  seasonWeightBefore: number;
  todayTotalWeight: number;
  seasonWeightTotal: number;

  productionRows: ProductionRow[];
  imports: (Import & {
    importItems: (ImportItem & { variant: VariantWithItem })[];
  })[];

  exports: (Export & {
    exportItems: (ExportItem & { variant: VariantWithItem })[];
  })[];
  materialsInventory: Inventory[];
  productsInventory: Inventory[];
};
type RateSummary = {
  rateId: number;
  laborerId: number;
  laborerName: string;
  laborerNumber: string | null;
  paymentType: PaymentType;
  dailySalary: number;
  days: number;
  gross: number;
  loans: number;
  loanPayments: number;
  net: number;
  paid: boolean;
  paidAt: Date | null;
};
type AttendanceSummary = {
  laborerId: number;
  laborerName: string;
  weeks: {
    weekId: number;
    startDate: string;
    days: {
      attendanceId: number;
      productionDayId: number;
      productionDate: string;
      factor: number;
    }[];
    total: number;
  }[];
  total: number;
};
type LedgerEntryType =
  | "IMPORT"
  | "EXPORT"
  | "CUSTOMER_RETURN"
  | "SUPPLIER_RETURN"
  | "LOAN"
  | "LOAN_PAYMENT"
  | "PAYMENT"
  | "EXPENSE";
type Ledger = {
  totalIn: number;
  totalOut: number;
  net: number;
  entries: {
    id: number;
    productionDayId: number;
    date: string;
    amount: number;
    type: LedgerEntryType;
    notes: string | null;
  }[];
};
const ledgerMap: Record<
  string,
  {
    type: LedgerEntryType;
    amountFormula: Prisma.Sql;
    joins: Prisma.Sql[];
    groupBy: Prisma.Sql;
  }
> = {
  Import: {
    type: "IMPORT",
    amountFormula: Prisma.sql`-(sum(tr.quantity*tr."unitPrice") + t."taxAdjustment"-t."discountAdjustment")`,
    joins: [Prisma.sql`join "ImportItem" as tr on tr."importId" = t.id`],
    groupBy: Prisma.sql`group by t.id,pd.id`,
  },
  Export: {
    type: "EXPORT",
    amountFormula: Prisma.sql`sum(tr.quantity*tr."unitPrice") + t."taxAdjustment"-t."discountAdjustment"`,
    joins: [Prisma.sql`join "ExportItem" as tr on tr."exportId" = t.id`],
    groupBy: Prisma.sql`group by t.id,pd.id`,
  },
  CustomerReturn: {
    type: "CUSTOMER_RETURN",
    amountFormula: Prisma.sql`-(sum(tr.quantity*tr."unitPrice") + t."taxAdjustment"-t."discountAdjustment")`,
    joins: [
      Prisma.sql`join "CustomerReturnItem" as tr on tr."customerReturnId" = t.id`,
    ],
    groupBy: Prisma.sql`group by t.id,pd.id`,
  },
  SupplierReturn: {
    type: "SUPPLIER_RETURN",
    amountFormula: Prisma.sql`sum(tr.quantity*tr."unitPrice") + t."taxAdjustment"-t."discountAdjustment"`,
    joins: [
      Prisma.sql`join "SupplierReturnItem" as tr on tr."supplierReturnId" = t.id`,
    ],
    groupBy: Prisma.sql`group by t.id,pd.id`,
  },
  Loan: {
    type: "LOAN",
    amountFormula: Prisma.sql`-t.amount`,
    joins: [Prisma.empty],
    groupBy: Prisma.empty,
  },
  LoanPayment: {
    type: "LOAN_PAYMENT",
    amountFormula: Prisma.sql`t.amount`,
    joins: [Prisma.empty],
    groupBy: Prisma.empty,
  },
  Payment: {
    type: "PAYMENT",
    amountFormula: Prisma.sql`-(t.gross-t.loans+t."loanPayments")`,
    joins: [Prisma.empty],
    groupBy: Prisma.empty,
  },
  Expense: {
    type: "EXPENSE",
    amountFormula: Prisma.sql`-t.amount`,
    joins: [Prisma.empty],
    groupBy: Prisma.empty,
  },
};
export const getLedgerSummary = async (
  query: getSummaryQueryDTO,
): Promise<Ledger> => {
  const conditions = buildWhereClause(query);
  const q1 = Object.entries(ledgerMap).map(
    ([key, { type, amountFormula, joins, groupBy }]) => Prisma.sql`
  select t.id as "id",pd.id as "productionDayId",to_char(pd."productionDate",'YYYY-MM-DD') as "date",coalesce(${amountFormula},0)::float as "amount",${type} as "type",t.notes as "notes"
  from ${Prisma.raw(key)} as t
  ${Prisma.join([...joins], " ")}
  join "ProductionDay" as pd on t."productionDayId" = pd.id
  join "Week" as w on pd."weekId" = w.id
  where ${conditions}
  ${groupBy}
  `,
  );
  const q2 = Prisma.sql`${Prisma.join(q1, " union all ")}`;
  const q3 = Prisma.sql`
  select t."totalIn",t."totalOut",(t."totalIn"+t."totalOut")::float as "net",t.entries as "entries"
  from (
    select sum(u."amount" filter (where u."type" in ('EXPORT','SUPPLIER_RETURN','LOAN_PAYMENT')))::float as "totalIn",
           sum(u."amount" filter (where u."type" in ('IMPORT','CUSTOMER_RETURN','LOAN','PAYMENT','EXPENSE')))::float as "totalOut",
           jsonb_agg(jsonb_build_object(
            'id',u."id",
            'productionDayId',u."productionDayId",
            'date',u."date",
            'amount',u."amount",
            'type',u."type",
            'notes',u."notes"
           ) order by u."date") as entries
    from (${q2}) as u
  ) as t
  `;
  return await prisma.$queryRaw<Ledger>(q3);
};
export const getAttendanceSummary = async (
  query: getSummaryQueryDTO,
): Promise<AttendanceSummary[]> => {
  const conditions = buildWhereClause(query);
  const q1 = Prisma.sql`
  select l.id as "laborerId", l.name as "laborerName",w.id as "weekId",to_char(w."startDate",'YYYY-MM-DD') as "startDate",
  jsonb_agg(jsonb_build_object(
    'attendanceId',a.id,
    'productionDayId',pd.id,
    'productionDate',to_char(pd."productionDate",'YYYY-MM-DD'),
    'factor',coalesce(a.factor,0)::float
  ) order by pd."productionDate") as days,
  coalesce(sum(a.factor),0)::float as "total"
  from "Attendance" as a
  join "Rate" as r on a."rateId" = r.id
  join "Laborer" as l on r."laborerId" = l.id
  join "ProductionDay" as pd on a."productionDayId" = pd.id
  join "Week" as w on pd."weekId" = w.id
  where ${conditions}
  group by l.id,w.id
  `;
  const q2 = Prisma.sql`
  select wk."laborerId",wk."laborerName",jsonb_agg(
    jsonb_build_object(
      'weekId',wk."weekId",
      'startDate',wk."startDate",
      'days',wk."days",
      'total',wk."total"
    ) order by wk."startDate")as weeks,
    sum(wk."total")::float as "total"
  from (${q1}) as wk
  group by wk."laborerId",wk."laborerName"
  `;
  return await prisma.$queryRaw<AttendanceSummary[]>(q2);
};
export const getRateSummary = async (
  query: getSummaryQueryDTO,
): Promise<{
  rows: RateSummary[];
  totalGross: number;
  totalLoans: number;
  totalLoanPayments: number;
  totalNet: number;
}> => {
  const rates = await prisma.rate.findMany({
    where: { from: { lte: query.to }, to: { gte: query.from } },
    include: {
      laborer: true,
      attendances: true,
      loans: true,
      loanPayments: true,
      payment: true,
    },
  });
  const rows: RateSummary[] = rates.map((rate) => {
    const days = rate.attendances.reduce(
      (acc, a) => acc + a.factor.toNumber(),
      0,
    );
    let gross = 0;
    let loans = 0;
    let loanPayments = 0;
    let net = 0;
    let paid = !!rate.payment;
    let paidAt: Date | null = null;
    if (!rate.payment) {
      gross = days * rate.dailySalary.toNumber();
      loans = rate.loans.reduce((acc, l) => acc + l.amount.toNumber(), 0);
      loanPayments = rate.loanPayments.reduce(
        (acc, lp) => acc + lp.amount.toNumber(),
        0,
      );
      net = gross - loans + loanPayments;
    } else {
      gross = rate.payment.gross.toNumber();
      loans = rate.payment.loans.toNumber();
      loanPayments = rate.payment.loanPayments.toNumber();
      net = rate.payment.net.toNumber();
      paidAt = rate.payment.occurredAt;
    }
    return {
      rateId: rate.id,
      laborerId: rate.laborer.id,
      laborerName: rate.laborer.name,
      laborerNumber: rate.laborer.number,
      paymentType: rate.paymentType,
      dailySalary: rate.dailySalary.toNumber(),
      days,
      gross,
      loans,
      loanPayments,
      net,
      paid,
      paidAt,
    };
  });
  return {
    rows,
    totalGross: rows.reduce((acc, row) => acc + row.gross, 0),
    totalLoans: rows.reduce((acc, row) => acc + row.loans, 0),
    totalLoanPayments: rows.reduce((acc, row) => acc + row.loanPayments, 0),
    totalNet: rows.reduce((acc, row) => acc + row.net, 0),
  };
};
export const getProductionDaySheet = async (
  query: getSheetParamsDTO,
): Promise<ProductionDaySheet> => {
  const productionDay = await prisma.productionDay.findUnique({
    where: { id: query.id },
    include: { week: { include: { season: true } } },
  });
  if (!productionDay) throw new NotFoundException("ProductionDay not found");
  const seasonId = productionDay.week.seasonId;
  const imports = await prisma.import.findMany({
    where: { productionDayId: productionDay.id },
    include: {
      importItems: { include: { variant: { include: { item: true } } } },
    },
    orderBy: { occurredAt: "asc" },
  });
  const exports = await prisma.export.findMany({
    where: { productionDayId: productionDay.id },
    include: {
      exportItems: { include: { variant: { include: { item: true } } } },
    },
    orderBy: { occurredAt: "asc" },
  });
  const productsInventory = await getInventory(
    productionDay.productionDate,
    ItemType.PRODUCT,
  );
  const materialsInventory = await getInventory(
    productionDay.productionDate,
    ItemType.MATERIAL,
  );
  const productionRows = await getProductionRows({
    seasonId,
    filter: {
      gte: productionDay.productionDate,
      lte: productionDay.productionDate,
    },
  });
  const seasonWeightBefore = (
    await getProductionRows({
      seasonId,
      filter: { lt: productionDay.productionDate },
    })
  ).reduce((acc, v) => acc + v.totalWeight, 0);
  const todayTotalWeight = productionRows.reduce(
    (acc, v) => acc + v.totalWeight,
    0,
  );
  const seasonWeightTotal = seasonWeightBefore + todayTotalWeight;
  const { week, ...dayClean } = productionDay;
  const { season, ...weekClean } = week;
  return {
    productionDay: dayClean,
    week: weekClean,
    season,
    productionRows,
    seasonWeightBefore,
    todayTotalWeight,
    seasonWeightTotal,
    imports,
    exports,
    productsInventory,
    materialsInventory,
  };
};
export const getVariantsProductionSummary = async (
  query: getSummaryQueryDTO,
): Promise<VariantProductionSummary[]> => {
  const conditions = buildWhereClause(query, [
    Prisma.sql`i.type = ${ItemType.PRODUCT}`,
  ]);
  return await prisma.$queryRaw<VariantProductionSummary[]>`
  select t."variantId",t."itemName",t."unitWeight",t."totalProduced",t."totalExported",
         coalesce(round(t."totalExported" * 100.0 / nullif(t."totalProduced", 0), 2), 0)::float as "percentage"
  from (
    select v.id as "variantId",i.name as "itemName",v."unitWeight"::float as "unitWeight",
           coalesce(sum(sm."quantityChanged") filter (where sm.type = ${StockMovementType.PRODUCTION_BATCH}), 0)::int as "totalProduced",
           (coalesce(-sum(sm."quantityChanged") filter (where sm.type = ${StockMovementType.EXPORT_ITEM}), 0)
            -coalesce(sum(sm."quantityChanged") filter (where sm.type = ${StockMovementType.CUSTOMER_RETURN_ITEM}), 0))::int as "totalExported"
    from "Variant" as v
    join "Item" as i on v."itemId" = i.id
    join "StockMovement" as sm on sm."variantId" = v.id
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    join "Week" as w on pd."weekId" = w.id
    where ${conditions}
    group by(v.id, i.id)
  ) as t
  order by "percentage" desc, t."totalExported" desc
`;
};
export const getItemsProductionSummary = async (
  query: getSummaryQueryDTO,
): Promise<{
  rows: ItemProductionSummary[];
  totalProducedWeight: number;
  totalExportedWeight: number;
}> => {
  const conditions = buildWhereClause(query, [
    Prisma.sql`i.type=${ItemType.PRODUCT}`,
  ]);
  const rows = await prisma.$queryRaw<ItemProductionSummary[]>`
  select t."itemId",t."itemName",t."totalProducedWeight",t."totalExportedWeight",
    coalesce(round(t."totalExportedWeight" * 100.0 / nullif(t."totalProducedWeight", 0), 2), 0)::float as "percentage"
  from (
    select i.id as "itemId",i.name as "itemName",
          coalesce(sum(sm."quantityChanged"*v."unitWeight") filter (where sm.type = ${StockMovementType.PRODUCTION_BATCH}), 0)::float as "totalProducedWeight",
          (coalesce(-sum(sm."quantityChanged"*v."unitWeight") filter (where sm.type = ${StockMovementType.EXPORT_ITEM}), 0)
            -coalesce(sum(sm."quantityChanged"*v."unitWeight") filter (where sm.type = ${StockMovementType.CUSTOMER_RETURN_ITEM}), 0))::float as "totalExportedWeight"
    from "Variant" as v
    join "Item" as i on v."itemId" = i.id
    join "StockMovement" as sm on sm."variantId" = v.id
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    join "Week" as w on pd."weekId" = w.id
    where ${conditions}
    group by(i.id)
  ) as t
  order by "percentage" desc, t."totalExportedWeight" desc
  `;
  return {
    rows,
    totalProducedWeight: rows.reduce(
      (acc, row) => acc + row.totalProducedWeight,
      0,
    ),
    totalExportedWeight: rows.reduce(
      (acc, row) => acc + row.totalExportedWeight,
      0,
    ),
  };
};
export const getVariantsConsumptionSummary = async (
  query: getSummaryQueryDTO,
): Promise<VariantConsumptionSummary[]> => {
  const conditions = buildWhereClause(query, [
    Prisma.sql`i.type = ${ItemType.MATERIAL}`,
  ]);
  return await prisma.$queryRaw<VariantConsumptionSummary[]>`
  select t."variantId",t."itemName",t."unitWeight",t."totalImported",t."totalConsumed",
         coalesce(round(t."totalConsumed" * 100.0 / nullif(t."totalImported", 0), 2), 0)::float as "percentage"
  from (
    select v.id as "variantId",i.name as "itemName",v."unitWeight"::float as "unitWeight",
          (coalesce(sum(sm."quantityChanged") filter (where sm.type = ${StockMovementType.IMPORT_ITEM}), 0)
            +coalesce(sum(sm."quantityChanged") filter (where sm.type = ${StockMovementType.SUPPLIER_RETURN_ITEM}), 0))::int as "totalImported",
           coalesce(-sum(sm."quantityChanged") filter (where sm.type = ${StockMovementType.CONSUMPTION}), 0)::int as "totalConsumed"

    from "Variant" as v
    join "Item" as i on v."itemId" = i.id
    join "StockMovement" as sm on sm."variantId" = v.id
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    join "Week" as w on pd."weekId" = w.id
    where ${conditions}
    group by(v.id, i.id)
  ) as t
  order by "percentage" desc, t."totalConsumed" desc
`;
};
export const getItemsConsumptionSummary = async (
  query: getSummaryQueryDTO,
): Promise<{rows:ItemConsumptionSummary[],totalImportedWeight:number,totalConsumedWeight:number}> => {
  const conditions = buildWhereClause(query, [
    Prisma.sql`i.type=${ItemType.MATERIAL}`,
  ]);
  const rows= await prisma.$queryRaw<ItemConsumptionSummary[]>`
  select t."itemId",t."itemName",t."totalImportedWeight",t."totalConsumedWeight",
    coalesce(round(t."totalConsumedWeight" * 100.0 / nullif(t."totalImportedWeight", 0), 2), 0)::float as "percentage"
  from (
    select i.id as "itemId",i.name as "itemName",
          (coalesce(sum(sm."quantityChanged"*v."unitWeight") filter (where sm.type = ${StockMovementType.IMPORT_ITEM}), 0)
            +coalesce(sum(sm."quantityChanged"*v."unitWeight") filter (where sm.type = ${StockMovementType.SUPPLIER_RETURN_ITEM}), 0))::float as "totalImportedWeight",
          coalesce(-sum(sm."quantityChanged"*v."unitWeight") filter (where sm.type = ${StockMovementType.CONSUMPTION}), 0)::float as "totalConsumedWeight"

    from "Variant" as v
    join "Item" as i on v."itemId" = i.id
    join "StockMovement" as sm on sm."variantId" = v.id
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    join "Week" as w on pd."weekId" = w.id
    where ${conditions}
    group by(i.id)
  ) as t
  order by "percentage" desc, t."totalConsumedWeight" desc
  `;
  return {
    rows,
    totalImportedWeight:rows.reduce((acc,row)=>acc+row.totalImportedWeight,0),
    totalConsumedWeight:rows.reduce((acc,row)=>acc+row.totalConsumedWeight,0),
  }
};
export const getCustomerSummary = async (
  query: getSummaryQueryDTO,
): Promise<{rows:CustomerSummary[],totalSold:number,totalTransactions:number}> => {
  const conditions = buildWhereClause(query);
  const sales = Prisma.sql`
  select t."customerId" as "customerId",count(*) as "transactions",sum(t.total) as "total"
  from (
    select e."customerId" as "customerId",coalesce(sum(ei.quantity*ei."unitPrice"),0)+(e."taxAdjustment"-e."discountAdjustment") as total
    from "ProductionDay" as pd
    join "Week" as w on pd."weekId" = w.id
    join "Export" as e on e."productionDayId" = pd.id
    join "ExportItem" as ei on ei."exportId" = e.id
    where ${conditions}
    group by e.id
  ) as t
  group by t."customerId"
  `;
  const returns = Prisma.sql`
  select t."customerId" as "customerId",sum(t.total) as "total"
  from (
  select r."customerId" as "customerId",coalesce(sum(ri.quantity*ri."unitPrice"),0)+(ri."taxAdjustment"-ri."discountAdjustment") as total
  from "ProductionDay" as pd
  join "Week" as w on pd."weekId" = w.id
  join "CustomerReturn" as r on r."productionDayId" = pd.id
  join "CustomerReturnItem" as ri on ri."customerReturnId" = r.id
  where ${conditions}
  group by r.id
  ) as t
  group by t."customerId"
  `;
  const q = Prisma.sql`
  with s as (${sales}), r as (${returns})
  select c.id as "customerId",c."name" as "customerName",c."number" as "customerNumber",coalesce(s.transactions,0)::int as "transactions",
  (coalesce(s.total,0)-coalesce(r.total,0))::float as "totalSold",
  coalesce(round((coalesce(s.total,0)-coalesce(r.total,0))/nullif(s.transactions,0),2),0)::float as "averageTransaction"
  from "Customer" as c
  left join s on s."customerId" = c.id
  left join r on r."customerId" = c.id
  where s."customerId" is not null or r."customerId" is not null
  order by "totalSold" desc, "transactions" desc
  `;
  const rows= await prisma.$queryRaw<CustomerSummary[]>(q);
  return {
    rows,
    totalSold:rows.reduce((acc,row)=>acc+row.totalSold,0),
    totalTransactions:rows.reduce((acc,row)=>acc+row.transactions,0),
  }
};
export const getSuppliersSummary = async (
  query: getSummaryQueryDTO,
): Promise<{rows:SupplierSummary[],totalBought:number,totalTransactions:number}> => {
  const conditions = buildWhereClause(query);
  const purchases = Prisma.sql`
  select t."supplierId" as "supplierId",count(*) as "transactions",sum(t.total) as "total"
  from (
    select i."supplierId" as "supplierId",coalesce(sum(ii.quantity*ii."unitPrice"),0)+(i."taxAdjustment"-i."discountAdjustment") as total
    from "ProductionDay" as pd
    join "Week" as w on pd."weekId" = w.id
    join "Import" as i on i."productionDayId" = pd.id
    join "ImportItem" as ii on ii."importId" = i.id
    where ${conditions}
    group by i.id
  ) as t
  group by t."supplierId"
  `;
  const returns = Prisma.sql`
  select t."supplierId" as "supplierId",sum(t.total) as "total"
  from (
    select r."supplierId" as "supplierId",coalesce(sum(ri.quantity*ri."unitPrice"),0)+(r."taxAdjustment"-r."discountAdjustment") as total
    from "ProductionDay" as pd
    join "Week" as w on pd."weekId" = w.id
    join "SupplierReturn" as r on r."productionDayId" = pd.id
    join "SupplierReturnItem" as ri on ri."supplierReturnId" = r.id
    where ${conditions}
    group by r.id
  ) as t
  group by t."supplierId"
  `;
  const q = Prisma.sql`
  with p as (${purchases}), r as (${returns})
  select s.id as "supplierId",s."name" as "supplierName",s."number" as "supplierNumber",
  coalesce(p.transactions,0)::int as "transactions",
  (coalesce(p.total,0)-coalesce(r.total,0))::float as "totalBought",
  coalesce(round((coalesce(p.total,0)-coalesce(r.total,0))/nullif(p.transactions,0),2),0)::float as "averageTransaction"
  from "Supplier" as s
  left join p on p."supplierId" = s.id
  left join r on r."supplierId" = s.id
  where p."supplierId" is not null or r."supplierId" is not null
  order by "totalBought" desc, "transactions" desc
  `;
  const rows= await prisma.$queryRaw<SupplierSummary[]>(q);
  return {
    rows,
    totalBought:rows.reduce((acc,row)=>acc+row.totalBought,0),
    totalTransactions:rows.reduce((acc,row)=>acc+row.transactions,0),
  }
};
const getProductionRows = async ({
  seasonId,
  filter,
}: { seasonId?: number; filter?: Prisma.DateTimeFilter } = {}): Promise<
  ProductionRow[]
> => {
  const productionEntries = await prisma.productionEntry.findMany({
    where: {
      productionDay: {
        productionDate: filter,
        week: { seasonId },
      },
    },
    include: { batches: true, variant: { include: { item: true } } },
    orderBy: { createdAt: "asc" },
  });
  return productionEntries.map((e) => {
    const totalQuantity = e.batches.reduce((acc, b) => acc + b.quantity, 0);
    const totalWeight = totalQuantity * e.variant.unitWeight.toNumber();
    return {
      entryId: e.id,
      variant: e.variant,
      batches: e.batches,
      totalQuantity,
      totalWeight,
    };
  });
};
const getInventory = async (
  productionDate: Date,
  type: ItemType,
): Promise<Inventory[]> => {
  const variants = await prisma.variant.findMany({
    where: { item: { type } },
    include: {
      item: true,
      stockMovements: {
        where: { productionDay: { productionDate } },
        orderBy: { occurredAt: "asc" },
      },
    },
  });
  const openings = await prisma.$queryRaw<
    { variantId: number; openingBalance: number }[]
  >`
    select v.id as "variantId", coalesce(sum(sm."quantityChanged") filter (where pd."productionDate" < ${productionDate}),0)::int as "openingBalance"
    from "StockMovement" as sm
    join "Variant" as v on sm."variantId" = v.id
    join "Item" as i on v."itemId" = i.id
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    where i.type = ${type}
    group by(v.id)
  `;
  const map = new Map<number, number>(
    openings.map((o) => [o.variantId, o.openingBalance]),
  );
  return variants.map(({ stockMovements, ...variant }) => {
    const openingBalance = map.get(variant.id) ?? 0;
    const changeAmount = stockMovements.reduce(
      (acc, sm) => acc + sm.quantityChanged,
      0,
    );
    return {
      variant,
      openingBalance,
      changes: stockMovements,
      changeAmount,
      closingBalance: openingBalance + changeAmount,
    };
  });
};
const buildWhereClause = (
  query: getSummaryQueryDTO,
  conditions: Prisma.Sql[] = [Prisma.sql`true`],
  join: string = " and ",
): Prisma.Sql => {
  if (query.from !== undefined)
    conditions.push(Prisma.sql`pd."productionDate" >= ${query.from}`);
  if (query.to !== undefined)
    conditions.push(Prisma.sql`pd."productionDate" <= ${query.to}`);
  if (query.seasonId !== undefined)
    conditions.push(Prisma.sql`w."seasonId" = ${query.seasonId}`);
  return Prisma.join(conditions, join);
};
