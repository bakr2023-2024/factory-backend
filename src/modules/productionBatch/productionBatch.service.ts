import {
  ProductionBatch,
  Prisma,
  StockMovementType,
} from "../../db/generated/prisma/client";
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
import {
  buildQuery,
  createStockMovement,
  deleteStockMovement,
  updateStockMovement,
} from "../../utils/utils";
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
  const productionEntry: Prisma.ProductionEntryWhereInput = {};
  if (pagination.productionEntryId)
    where.productionEntryId = pagination.productionEntryId;
  if (pagination.productionDayId)
    productionEntry.productionDayId = pagination.productionDayId;
  if (pagination.productionDate)
    productionEntry.productionDay = {
      productionDate: pagination.productionDate,
    };
  if (pagination.itemName)
    productionEntry.variant = {
      item: { name: { contains: pagination.itemName, mode: "insensitive" } },
    };
  if (pagination.unitWeight) {
    if (productionEntry.variant)
      productionEntry.variant.unitWeight = pagination.unitWeight;
    else productionEntry.variant = { unitWeight: pagination.unitWeight };
  }
  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  if (Object.keys(productionEntry).length)
    where.productionEntry = productionEntry;

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
    return await prisma.$transaction(async (tx) => {
      const productionBatch = await prisma.productionBatch.create({
        data: body,
        include: { productionEntry: true },
      });
      await createStockMovement(tx, {
        variant: { connect: { id: productionBatch.productionEntry.variantId } },
        productionDay: {
          connect: { id: productionBatch.productionEntry.productionDayId },
        },
        type: StockMovementType.PRODUCTION_BATCH,
        typeRef: productionBatch.id,
        quantityChanged: productionBatch.quantity,
      });
      return productionBatch;
    });
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
    return await prisma.$transaction(async (tx) => {
      const productionBatch = await prisma.productionBatch.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity)
        await updateStockMovement(
          tx,
          StockMovementType.SUPPLIER_RETURN_ITEM,
          productionBatch.id,
          productionBatch.quantity,
        );
      return productionBatch;
    });
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
    return await prisma.$transaction(async (tx) => {
      const productionBatch = await prisma.productionBatch.delete({
        where: { id: params.id },
      });
      await deleteStockMovement(
        tx,
        StockMovementType.PRODUCTION_BATCH,
        productionBatch.id,
      );
      return productionBatch;
    });
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
