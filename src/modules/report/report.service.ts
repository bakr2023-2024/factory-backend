import {
  Export,
  ExportItem,
  Import,
  ImportItem,
  Item,
  ItemType,
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
export const getProductionDaySheet = async (
  params: getSheetParamsDTO,
): Promise<ProductionDaySheet> => {
  const productionDay = await prisma.productionDay.findUnique({
    where: { id: params.id },
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
export const getProductionReport = async (
  query: getSummaryQueryDTO,
): Promise<ProductionRow[]> => {
  return await getProductionRows({
    seasonId: query.seasonId,
    filter: { gte: query.from, lte: query.to },
  });
};
export const getVariantsProductionReport = async (
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
    where ${Prisma.join(conditions, " and ")}
    group by(v.id, i.id)
  ) as t
  order by "percentage" desc, t."totalExported" desc
`;
};
export const getItemsProductionReport = async (
  query: getSummaryQueryDTO,
): Promise<ItemProductionSummary[]> => {
  const conditions = buildWhereClause(query, [
    Prisma.sql`i.type=${ItemType.PRODUCT}`,
  ]);
  return await prisma.$queryRaw<ItemProductionSummary[]>`
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
    where ${Prisma.join(conditions, " and ")}
    group by(i.id)
  ) as t
  order by "percentage" desc, t."totalExportedWeight" desc
  `;
};
export const getVariantsConsumptionReport = async (
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
    where ${Prisma.join(conditions, " and ")}
    group by(v.id, i.id)
  ) as t
  order by "percentage" desc, t."totalConsumed" desc
`;
};
export const getItemsConsumptionReport = async (
  query: getSummaryQueryDTO,
): Promise<ItemConsumptionSummary[]> => {
  const conditions = buildWhereClause(query, [
    Prisma.sql`i.type=${ItemType.MATERIAL}`,
  ]);
  return await prisma.$queryRaw<ItemConsumptionSummary[]>`
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
    where ${Prisma.join(conditions, " and ")}
    group by(i.id)
  ) as t
  order by "percentage" desc, t."totalConsumedWeight" desc
  `;
};
export const getCustomerReport = async (
  query: getSummaryQueryDTO,
): Promise<CustomerSummary[]> => {
  const conditions = buildWhereClause(query);
  return await prisma.$queryRaw<CustomerSummary[]>`
  select t."customerId",t."customerName",t."customerNumber",t."transactions",t."totalSold",round(t."totalSold"/nullif(t."transactions",0),2)::float as "averageTransaction"
  from (
    select c.id as "customerId", c.name as "customerName", c.number as "customerNumber",
      count(distinct e.id)::int as "transactions",
      (coalesce(sum(ei."unitPrice"*ei.quantity) filter(where sm.type=${StockMovementType.EXPORT_ITEM}),0) 
      - coalesce(sum(cri."unitPrice"*cri.quantity) filter(where sm.type=${StockMovementType.CUSTOMER_RETURN_ITEM}),0))::float as "totalSold"
    from "StockMovement" as sm
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    join "Week" as w on pd."weekId" = w.id
    left join "ExportItem" as ei on sm.type=${StockMovementType.EXPORT_ITEM} and sm."typeRef"=ei.id
    left join "Export" as e on ei."exportId" = e.id
    left join "CustomerReturnItem" as cri on sm.type=${StockMovementType.CUSTOMER_RETURN_ITEM} and sm."typeRef"=cri.id
    left join "CustomerReturn" as cr on cri."customerReturnId" = cr.id
    join "Customer" as c on c.id = coalesce(e."customerId",cr."customerId")
    where ${Prisma.join(conditions, " and ")}
    group by(c.id)
  ) as t
  order by t."totalSold" desc, t."transactions" desc
  `;
};
export const getSuppliersReport = async (
  query: getSummaryQueryDTO,
): Promise<SupplierSummary[]> => {
  const conditions = buildWhereClause(query);
  return await prisma.$queryRaw<SupplierSummary[]>`
  select t."supplierId",t."supplierName",t."supplierNumber",t."transactions",t."totalBought",round(t."totalBought"/nullif(t."transactions",0),2)::float as "averageTransaction"
  from (
    select s.id as "supplierId", s.name as "supplierName", s.number as "supplierNumber",
      count(distinct i.id)::int as "transactions",
      (coalesce(sum(ii."unitPrice"*ii.quantity) filter(where sm.type=${StockMovementType.IMPORT_ITEM}),0) 
      - coalesce(sum(sri."unitPrice"*sri.quantity) filter(where sm.type=${StockMovementType.SUPPLIER_RETURN_ITEM}),0))::float as "totalBought"
    from "StockMovement" as sm
    join "ProductionDay" as pd on sm."productionDayId" = pd.id
    join "Week" as w on pd."weekId" = w.id
    left join "ImportItem" as ii on sm.type=${StockMovementType.IMPORT_ITEM} and sm."typeRef"=ii.id
    left join "Import" as i on ii."importId" = i.id
    left join "SupplierReturnItem" as sri on sm.type=${StockMovementType.SUPPLIER_RETURN_ITEM} and sm."typeRef"=sri.id
    left join "SupplierReturn" as sr on sri."supplierReturnId" = sr.id
    join "Supplier" as s on s.id = coalesce(i."supplierId",sr."supplierId")
    where ${Prisma.join(conditions, " and ")}
    group by(s.id)
  ) as t
  order by t."totalBought" desc, t."transactions" desc
  `;
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
) => {
  if (query.from !== undefined)
    conditions.push(Prisma.sql`pd."productionDate" >= ${query.from}`);
  if (query.to !== undefined)
    conditions.push(Prisma.sql`pd."productionDate" <= ${query.to}`);
  if (query.seasonId !== undefined)
    conditions.push(Prisma.sql`w."seasonId" = ${query.seasonId}`);
  return conditions;
};
