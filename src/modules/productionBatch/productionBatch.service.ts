import { ProductionBatch, Prisma } from "../../db/generated/prisma/client";
import {
  ProductionBatchFindManyArgs,
  ProductionBatchWhereInput,
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
  createProductionBatchBodyDTO,
  deleteProductionBatchParamsDTO,
  getProductionBatchParamsDTO,
  paginateProductionBatchesDTO,
  updateProductionBatchBodyDTO,
  updateProductionBatchParamsDTO,
} from "./productionBatch.validation";

export const getProductionBatches = async (
  pagination: paginateProductionBatchesDTO,
): Promise<PaginationType<ProductionBatch[]>> => {
  const { page, size } = pagination;
  const query: ProductionBatchFindManyArgs = {};
  const where: ProductionBatchWhereInput = {};
  const orderBy: Prisma.ProductionBatchOrderByWithRelationInput = {};

  // inject fields into query

  if (pagination.productionEntryId)
    where.productionEntryId = pagination.productionEntryId;
  if (pagination.productionDayId)
    where.productionEntry = { productionDayId: pagination.productionDayId };
  if (pagination.productionDate)
    if (where.productionEntry)
      where.productionEntry.productionDay = {
        productionDate: pagination.productionDate,
      };
    else
      where.productionEntry = {
        productionDay: { productionDate: pagination.productionDate },
      };
  if (pagination.itemName)
    if (where.productionEntry)
      where.productionEntry.variant = {
        item: { name: { contains: pagination.itemName, mode: "insensitive" } },
      };
    else
      where.productionEntry = {
        variant: {
          item: {
            name: { contains: pagination.itemName, mode: "insensitive" },
          },
        },
      };
  if (pagination.unitWeight) {
    if (where.productionEntry) {
      if (where.productionEntry.variant)
        where.productionEntry.variant.unitWeight = pagination.unitWeight;
      else
        where.productionEntry.variant = { unitWeight: pagination.unitWeight };
    } else
      where.productionEntry = {
        variant: { unitWeight: pagination.unitWeight },
      };
  }
  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.productionBatch.findMany(query);
  const totalCount = await prisma.productionBatch.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getProductionBatch = async (
  params: getProductionBatchParamsDTO,
): Promise<ProductionBatch> => {
  const productionBatch = await prisma.productionBatch.findUnique({
    where: { id: params.id },
  });
  if (!productionBatch)
    throw new NotFoundException("ProductionBatch not found");
  return productionBatch;
};
export const createProductionBatch = async (
  body: createProductionBatchBodyDTO,
): Promise<ProductionBatch> => {
  try {
    const productionBatch = await prisma.productionBatch.create({ data: body });
    return productionBatch;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No productionEntry exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateProductionBatch = async (
  params: updateProductionBatchParamsDTO,
  body: updateProductionBatchBodyDTO,
): Promise<ProductionBatch> => {
  try {
    const productionBatch = await prisma.productionBatch.update({
      where: { id: params.id },
      data: body,
    });
    return productionBatch;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionBatch not found");
      else if (err.code === "P2003")
        throw new ConflictException("No productionEntry exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteProductionBatch = async (
  params: deleteProductionBatchParamsDTO,
): Promise<ProductionBatch> => {
  try {
    const productionBatch = await prisma.productionBatch.delete({
      where: { id: params.id },
    });
    return productionBatch;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionBatch not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
