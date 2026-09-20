import { Prisma } from "../db/generated/prisma/client";
import { paginateCustomersDTO } from "../modules/customer/customer.validation";
import { paginateExportsDTO } from "../modules/export/export.validation";
import { paginateExportItemsDTO } from "../modules/exportItem/exportItem.validation";
import { paginateImportsDTO } from "../modules/import/import.validation";
import { paginateImportItemsDTO } from "../modules/importItem/importItem.validation";
import { paginateItemsDTO } from "../modules/item/item.validation";
import { paginateSuppliersDTO } from "../modules/supplier/supplier.validation";
import { paginateVariantsDTO } from "../modules/variant/variant.validation";

type Query =
  | Prisma.ItemFindManyArgs
  | Prisma.VariantFindManyArgs
  | Prisma.SupplierFindManyArgs
  | Prisma.CustomerFindManyArgs
  | Prisma.ImportFindManyArgs
  | Prisma.ExportFindManyArgs
  | Prisma.ImportItemFindManyArgs
  | Prisma.ExportItemFindManyArgs;

type Where =
  | Prisma.ItemWhereInput
  | Prisma.VariantWhereInput
  | Prisma.SupplierWhereInput
  | Prisma.CustomerWhereInput
  | Prisma.ImportWhereInput
  | Prisma.ExportWhereInput
  | Prisma.ImportItemWhereInput
  | Prisma.ExportItemWhereInput;

type OrderBy =
  | Prisma.ItemOrderByWithRelationInput
  | Prisma.VariantOrderByWithRelationInput
  | Prisma.SupplierOrderByWithRelationInput
  | Prisma.CustomerOrderByWithRelationInput
  | Prisma.ImportOrderByWithRelationInput
  | Prisma.ExportOrderByWithRelationInput
  | Prisma.ImportItemOrderByWithRelationInput
  | Prisma.ExportItemOrderByWithRelationInput;

type Pagination =
  | paginateItemsDTO
  | paginateVariantsDTO
  | paginateSuppliersDTO
  | paginateCustomersDTO
  | paginateImportsDTO
  | paginateExportsDTO
  | paginateImportItemsDTO
  | paginateExportItemsDTO;

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
