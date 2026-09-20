import { ExportItem, Prisma } from "../../db/generated/prisma/client";
import { ExportItemWhereInput } from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import { buildQuery } from "../../utils/utils";
import {
  createExportItemBodyDTO,
  deleteExportItemParamsDTO,
  getExportItemParamsDTO,
  paginateExportItemsDTO,
  updateExportItemBodyDTO,
  updateExportItemParamsDTO,
} from "./exportItem.validation";

export const getExportItems = async (
  pagination: paginateExportItemsDTO,
): Promise<PaginationType<ExportItem[]>> => {
  const { page, size } = pagination;

  const query: Prisma.ExportItemFindManyArgs = {};
  const where: Prisma.ExportItemWhereInput = {};
  const orderBy: Prisma.ExportItemOrderByWithRelationInput = {};

  if (pagination.customerId)
    where.export = { customerId: pagination.customerId };

  if (pagination.variantId) where.variantId = pagination.variantId;

  if (pagination.exportId) where.exportId = pagination.exportId;

  if (pagination.itemId) where.variant = { itemId: pagination.itemId };

  if (pagination.customerName) {
    where.export = {
      customer: {
        name: {
          contains: pagination.customerName,
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
  if (pagination.minPrice || pagination.maxPrice) where.unitPrice = unitPrice;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.exportItem.findMany(query);

  const totalCount = await prisma.exportItem.count({ where });
  const totalPages = Math.ceil(totalCount / size);

  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getExportItem = async (
  params: getExportItemParamsDTO,
): Promise<ExportItem> => {
  const exportItem = await prisma.exportItem.findUnique({
    where: { id: params.id },
  });
  if (!exportItem) throw new NotFoundException("ExportItem not found");
  return exportItem;
};
export const createExportItem = async (
  body: createExportItemBodyDTO,
): Promise<ExportItem> => {
  try {
    const exportItem = await prisma.exportItem.create({ data: body });
    return exportItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No exportId/variantId exists with this ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateExportItem = async (
  params: updateExportItemParamsDTO,
  body: updateExportItemBodyDTO,
): Promise<ExportItem> => {
  try {
    const exportItem = await prisma.exportItem.update({
      where: { id: params.id },
      data: body,
    });
    return exportItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ExportItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No exportId/variantId exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteExportItem = async (
  params: deleteExportItemParamsDTO,
): Promise<ExportItem> => {
  try {
    const exportItem = await prisma.exportItem.delete({
      where: { id: params.id },
    });
    return exportItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ExportItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
