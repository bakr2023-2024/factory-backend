import { ExportItem, Prisma } from "../../db/generated/prisma/client";
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

  const exporte: Prisma.ExportWhereInput = {};
  const variant: Prisma.VariantWhereInput = {};
  const unitPrice: Prisma.DecimalFilter = {};
  if (pagination.customerId) exporte.customerId = pagination.customerId;

  if (pagination.variantId) where.variantId = pagination.variantId;

  if (pagination.exportId) where.exportId = pagination.exportId;

  if (pagination.itemId) variant.itemId = pagination.itemId;

  if (pagination.customerName) {
    exporte.customer = {
      name: {
        contains: pagination.customerName,
        mode: "insensitive",
      },
    };
  }
  if (pagination.customerNumber) {
    if (exporte.customer)
      exporte.customer.number = {
        contains: pagination.customerNumber,
        mode: "insensitive",
      };
    else
      exporte.customer = {
        number: {
          contains: pagination.customerNumber,
          mode: "insensitive",
        },
      };
  }

  if (pagination.itemName) {
    variant.item = {
      name: {
        contains: pagination.itemName,
        mode: "insensitive",
      },
    };
  }

  if (pagination.minPrice)
    unitPrice.gte = new Prisma.Decimal(pagination.minPrice);
  if (pagination.maxPrice)
    unitPrice.lte = new Prisma.Decimal(pagination.maxPrice);

  if (Object.keys(exporte).length) where.export = exporte;
  if (Object.keys(variant).length) where.variant = variant;
  if (Object.keys(unitPrice).length) where.unitPrice = unitPrice;

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
        throw new ConflictException("No export/variant exists with that ID");
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
        throw new ConflictException("No export/variant exists with that ID");
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
