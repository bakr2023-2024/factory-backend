import {
  ProductionBatch,
  Prisma,
  StockMovementType,
} from "../../db/generated/prisma/client";
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
  productionBatchRules,
  updateProductionBatchBodyDTO,
  updateProductionBatchParamsDTO,
} from "./productionBatch.validation";
import { paginated } from "../../utils/generalFields";

export const getProductionBatches = async (
  pagination: paginateProductionBatchesDTO,
): Promise<PaginationType<ProductionBatch[]>> => {
    const query = buildQuery(productionBatchRules, pagination);
    const [data, totalCount] = await Promise.all([
      prisma.productionBatch.findMany(query),
      prisma.productionBatch.count({ where: query.where }),
    ]);
    return paginated(data, pagination, totalCount);
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
      const productionBatch = await tx.productionBatch.create({
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
      const productionBatch = await tx.productionBatch.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity)
        await updateStockMovement(
          tx,
          StockMovementType.PRODUCTION_BATCH,
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
      const productionBatch = await tx.productionBatch.delete({
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
