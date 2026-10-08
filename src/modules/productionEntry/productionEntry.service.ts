import { ProductionEntry, Prisma } from "../../db/generated/prisma/client";
import {
  ProductionEntryFindManyArgs,
  ProductionEntryWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createProductionEntryBodyDTO,
  deleteProductionEntryParamsDTO,
  getProductionEntryParamsDTO,
  paginateProductionEntriesDTO,
  updateProductionEntryBodyDTO,
  updateProductionEntryParamsDTO,
} from "./productionEntry.validation";

export const getProductionEntries = async (
  pagination: paginateProductionEntriesDTO,
): Promise<PaginationType<ProductionEntry[]>> => {
  const { page, size } = pagination;
  const query: ProductionEntryFindManyArgs = {};
  const where: ProductionEntryWhereInput = {};
  const orderBy: Prisma.ProductionEntryOrderByWithRelationInput = {};
  // inject fields into query
  const productionDay: Prisma.ProductionDayWhereInput = {};
  const variant: Prisma.VariantWhereInput = {};
  if (pagination.productionDayId)
    where.productionDayId = pagination.productionDayId;
  if (pagination.variantId) where.variantId = pagination.variantId;
  if (pagination.productionDate) {
    productionDay.productionDate = pagination.productionDate;
  }
  if (pagination.itemName) {
    variant.item = {
      name: { contains: pagination.itemName, mode: "insensitive" },
    };
  }
  if (pagination.unitWeight) {
    variant.unitWeight = pagination.unitWeight;
  }

  if (Object.keys(productionDay).length) where.productionDay = productionDay;
  if (Object.keys(variant).length) where.variant = variant;

  buildQuery(pagination, query, where, orderBy);
  const data = await prisma.productionEntry.findMany(query);
  const totalCount = await prisma.productionEntry.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getProductionEntry = async (
  params: getProductionEntryParamsDTO,
): Promise<ProductionEntry> => {
  const productionEntry = await prisma.productionEntry.findUnique({
    where: { id: params.id },
  });
  if (!productionEntry)
    throw new NotFoundException("ProductionEntry not found");
  return productionEntry;
};
export const createProductionEntry = async (
  body: createProductionEntryBodyDTO,
): Promise<ProductionEntry> => {
  try {
    const productionEntry = await prisma.productionEntry.create({ data: body });
    return productionEntry;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No productionDay/variant exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateProductionEntry = async (
  params: updateProductionEntryParamsDTO,
  body: updateProductionEntryBodyDTO,
): Promise<ProductionEntry> => {
  try {
    const productionEntry = await prisma.productionEntry.update({
      where: { id: params.id },
      data: body,
    });
    return productionEntry;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionEntry not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No productionDay/variant exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteProductionEntry = async (
  params: deleteProductionEntryParamsDTO,
): Promise<ProductionEntry> => {
  try {
    const productionEntry = await prisma.productionEntry.delete({
      where: { id: params.id },
    });
    return productionEntry;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionEntry not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
