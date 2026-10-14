import {
  Prisma,
  StockMovementType,
} from "../db/generated/prisma/client";
import { paginateConsumptionsDTO } from "../modules/consumption/consumption.validation";
import { paginateCustomersDTO } from "../modules/customer/customer.validation";
import { paginateCustomerReturnsDTO } from "../modules/customerReturn/customerReturn.validation";
import { paginateCustomerReturnItemsDTO } from "../modules/customerReturnItem/customerReturnItem.validation";
import { paginateExportsDTO } from "../modules/export/export.validation";
import { paginateExportItemsDTO } from "../modules/exportItem/exportItem.validation";
import { paginateImportsDTO } from "../modules/import/import.validation";
import { paginateImportItemsDTO } from "../modules/importItem/importItem.validation";
import { paginateItemsDTO } from "../modules/item/item.validation";
import { paginateProductionBatchesDTO } from "../modules/productionBatch/productionBatch.validation";
import { paginateProductionDaysDTO } from "../modules/productionDay/productionDay.validation";
import { paginateProductionEntriesDTO } from "../modules/productionEntry/productionEntry.validation";
import { paginateSeasonsDTO } from "../modules/season/season.validation";
import { paginateStockMovementsDTO } from "../modules/stockMovement/stockMovement.validation";
import { paginateSuppliersDTO } from "../modules/supplier/supplier.validation";
import { paginateSupplierReturnsDTO } from "../modules/supplierReturn/supplierReturn.validation";
import { paginateSupplierReturnItemsDTO } from "../modules/supplierReturnItem/supplierReturnItem.validation";
import { paginateVariantsDTO } from "../modules/variant/variant.validation";
import { paginateWeeksDTO } from "../modules/week/week.validation";
import {
  StockMovementCreateInput,
} from "../db/generated/prisma/models";

type Query =
  | Prisma.ItemFindManyArgs
  | Prisma.VariantFindManyArgs
  | Prisma.SupplierFindManyArgs
  | Prisma.CustomerFindManyArgs
  | Prisma.ImportFindManyArgs
  | Prisma.ExportFindManyArgs
  | Prisma.ImportItemFindManyArgs
  | Prisma.ExportItemFindManyArgs
  | Prisma.SeasonFindManyArgs
  | Prisma.WeekFindManyArgs
  | Prisma.ProductionDayFindManyArgs
  | Prisma.ProductionEntryFindManyArgs
  | Prisma.ProductionBatchFindManyArgs
  | Prisma.ConsumptionFindManyArgs
  | Prisma.CustomerReturnFindManyArgs
  | Prisma.CustomerReturnItemFindManyArgs
  | Prisma.SupplierReturnFindManyArgs
  | Prisma.SupplierReturnItemFindManyArgs
  | Prisma.StockMovementFindManyArgs;

type Where =
  | Prisma.ItemWhereInput
  | Prisma.VariantWhereInput
  | Prisma.SupplierWhereInput
  | Prisma.CustomerWhereInput
  | Prisma.ImportWhereInput
  | Prisma.ExportWhereInput
  | Prisma.ImportItemWhereInput
  | Prisma.ExportItemWhereInput
  | Prisma.SeasonWhereInput
  | Prisma.WeekWhereInput
  | Prisma.ProductionDayWhereInput
  | Prisma.ProductionEntryWhereInput
  | Prisma.ProductionBatchWhereInput
  | Prisma.ConsumptionWhereInput
  | Prisma.CustomerReturnWhereInput
  | Prisma.CustomerReturnItemWhereInput
  | Prisma.SupplierReturnWhereInput
  | Prisma.SupplierReturnItemWhereInput
  | Prisma.StockMovementWhereInput;

type OrderBy =
  | Prisma.ItemOrderByWithRelationInput
  | Prisma.VariantOrderByWithRelationInput
  | Prisma.SupplierOrderByWithRelationInput
  | Prisma.CustomerOrderByWithRelationInput
  | Prisma.ImportOrderByWithRelationInput
  | Prisma.ExportOrderByWithRelationInput
  | Prisma.ImportItemOrderByWithRelationInput
  | Prisma.ExportItemOrderByWithRelationInput
  | Prisma.SeasonOrderByWithRelationInput
  | Prisma.WeekOrderByWithRelationInput
  | Prisma.ProductionDayOrderByWithRelationInput
  | Prisma.ProductionEntryOrderByWithRelationInput
  | Prisma.ProductionBatchOrderByWithRelationInput
  | Prisma.ConsumptionOrderByWithRelationInput
  | Prisma.CustomerReturnOrderByWithRelationInput
  | Prisma.CustomerReturnItemOrderByWithRelationInput
  | Prisma.SupplierReturnOrderByWithRelationInput
  | Prisma.SupplierReturnItemOrderByWithRelationInput
  | Prisma.StockMovementOrderByWithRelationInput;

type Pagination =
  | paginateItemsDTO
  | paginateVariantsDTO
  | paginateSuppliersDTO
  | paginateCustomersDTO
  | paginateImportsDTO
  | paginateExportsDTO
  | paginateImportItemsDTO
  | paginateExportItemsDTO
  | paginateSeasonsDTO
  | paginateWeeksDTO
  | paginateProductionDaysDTO
  | paginateProductionEntriesDTO
  | paginateProductionBatchesDTO
  | paginateConsumptionsDTO
  | paginateCustomerReturnsDTO
  | paginateCustomerReturnItemsDTO
  | paginateSupplierReturnsDTO
  | paginateSupplierReturnItemsDTO
  | paginateStockMovementsDTO;

export const buildQuery = (
  pagination: Pagination,
  query: Query,
  where: Where,
  orderBy: OrderBy,
) => {
  const { page, size } = pagination;
  const createdAt: Prisma.DateTimeFilter = {};

  if (pagination.sortBy)
    orderBy[pagination.sortBy as keyof OrderBy] = pagination.order;
  if (pagination.createdFrom) createdAt.gte = pagination.createdFrom;
  if (pagination.createdTo) createdAt.lte = pagination.createdTo;
  if (pagination.createdFrom || pagination.createdTo)
    where.createdAt = createdAt;
  query.skip = (page - 1) * pagination.size;
  query.take = size;
  query.where = where;
  query.orderBy = orderBy;
};
export const createStockMovement = async (
  tx: Prisma.TransactionClient,
  data: StockMovementCreateInput,
) => {
  const stockMovement = await tx.stockMovement.create({ data });
  await tx.variant.update({
    where: { id: stockMovement.variantId },
    data: { currentStock: { increment: stockMovement.quantityChanged } },
  });
};

export const updateStockMovement = async (
  tx: Prisma.TransactionClient,
  type: StockMovementType,
  typeRef: number,
  quantityChanged: number,
) => {
  const oldStockMovement = await tx.stockMovement.findUniqueOrThrow({
    where: { type_typeRef: { type, typeRef } },
  });
  const stockMovement = await tx.stockMovement.update({
    where: { type_typeRef: { type, typeRef } },
    data: { quantityChanged },
  });
  await tx.variant.update({
    where: {
      id: stockMovement.variantId,
    },
    data: {
      currentStock: {
        increment: quantityChanged - oldStockMovement.quantityChanged,
      },
    },
  });
};
export const deleteStockMovement = async (
  tx: Prisma.TransactionClient,
  type: StockMovementType,
  typeRef: number,
) => {
  const stockMovement = await tx.stockMovement.delete({
    where: { type_typeRef: { type, typeRef } },
  });
  await tx.variant.update({
    where: { id: stockMovement.variantId },
    data: { currentStock: { decrement: stockMovement.quantityChanged } },
  });
};
