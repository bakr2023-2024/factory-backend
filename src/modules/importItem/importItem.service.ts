import { ImportItem, Prisma } from "../../db/generated/prisma/client";
import {
  ImportItemFindManyArgs,
  ImportItemWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import { buildQuery } from "../../utils/utils";
import {
  createImportItemBodyDTO,
  deleteImportItemParamsDTO,
  getImportItemParamsDTO,
  paginateImportItemsDTO,
  updateImportItemBodyDTO,
  updateImportItemParamsDTO,
} from "./importItem.validation";

export const getImportItems = async (
  pagination: paginateImportItemsDTO,
): Promise<PaginationType<ImportItem[]>> => {
  const { page, size } = pagination;

  const query: Prisma.ImportItemFindManyArgs = {};
  const where: Prisma.ImportItemWhereInput = {};
  const orderBy: Prisma.ImportItemOrderByWithRelationInput = {};

  if (pagination.supplierId)
    where.import = { supplierId: pagination.supplierId };

  if (pagination.variantId) where.variantId = pagination.variantId;

  if (pagination.importId) where.importId = pagination.importId;

  if (pagination.itemId) where.variant = { itemId: pagination.itemId };

  if (pagination.supplierName) {
    where.import = {
      supplier: {
        name: {
          contains: pagination.supplierName,
          mode: "insensitive",
        },
      },
    };
  }

  if (pagination.itemName) {
    where.variant = {
      item: {
        name: {
          contains: pagination.itemName,
          mode: "insensitive",
        },
      },
    };
  }

  const unitPrice: Prisma.DecimalFilter = {};

  if (pagination.minPrice)
    unitPrice.gte = new Prisma.Decimal(pagination.minPrice);
  if (pagination.maxPrice)
    unitPrice.lte = new Prisma.Decimal(pagination.maxPrice);
  if (pagination.minPrice || pagination.maxPrice) 
    where.unitPrice = unitPrice;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.importItem.findMany(query);

  const totalCount = await prisma.importItem.count({ where });
  const totalPages = Math.ceil(totalCount / size);

  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getImportItem = async (
  params: getImportItemParamsDTO,
): Promise<ImportItem> => {
  const importItem = await prisma.importItem.findUnique({
    where: { id: params.id },
  });
  if (!importItem) throw new NotFoundException("ImportItem not found");
  return importItem;
};
export const createImportItem = async (
  body: createImportItemBodyDTO,
): Promise<ImportItem> => {
  try {
    const importItem = await prisma.importItem.create({ data: body });
    return importItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No importId/variantId exists with this ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateImportItem = async (
  params: updateImportItemParamsDTO,
  body: updateImportItemBodyDTO,
): Promise<ImportItem> => {
  try {
    const importItem = await prisma.importItem.update({
      where: { id: params.id },
      data: body,
    });
    return importItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ImportItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No importId/variantId exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteImportItem = async (
  params: deleteImportItemParamsDTO,
): Promise<ImportItem> => {
  try {
    const importItem = await prisma.importItem.delete({
      where: { id: params.id },
    });
    return importItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ImportItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
