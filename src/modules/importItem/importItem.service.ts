import {
  ImportItem,
  Prisma,
  StockMovementType,
} from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  HttpException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { paginated } from "../../utils/generalFields";
import { PaginationType } from "../../utils/types/types";
import {
  buildQuery,
  createStockMovement,
  deleteStockMovement,
  updateStockMovement,
} from "../../utils/utils";
import {
  createImportItemBodyDTO,
  deleteImportItemParamsDTO,
  getImportItemParamsDTO,
  importItemRules,
  paginateImportItemsDTO,
  updateImportItemBodyDTO,
  updateImportItemParamsDTO,
} from "./importItem.validation";

export const getImportItems = async (
  pagination: paginateImportItemsDTO,
): Promise<PaginationType<ImportItem[]>> => {
  const query = buildQuery(importItemRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.importItem.findMany(query),
    prisma.importItem.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
    return await prisma.$transaction(async (tx) => {
      const importItem = await tx.importItem.create({
        data: body,
        include: { import: true },
      });
      await createStockMovement(tx, {
        variant: { connect: { id: importItem.variantId } },
        productionDay: { connect: { id: importItem.import.productionDayId } },
        type: StockMovementType.IMPORT_ITEM,
        typeRef: importItem.id,
        quantityChanged: importItem.quantity,
      });
      return importItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No import/variant exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateImportItem = async (
  params: updateImportItemParamsDTO,
  body: updateImportItemBodyDTO,
): Promise<ImportItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      if (body.quantity !== undefined) {
        const importItem = await tx.importItem.findUniqueOrThrow({
          where: { id: params.id },
          include: { supplierReturnItem: true },
        });
        const returnQuantity = importItem.supplierReturnItem?.quantity;
        if (returnQuantity !== undefined && returnQuantity > body.quantity)
          throw new ConflictException(
            "returned quantity can't be more than imported quantity",
          );
      }
      const importItem = await tx.importItem.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity !== undefined) {
        await updateStockMovement(
          tx,
          StockMovementType.IMPORT_ITEM,
          importItem.id,
          importItem.quantity,
        );
      }
      return importItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ImportItem not found");
      else if (err.code === "P2003")
        throw new ConflictException("No import/variant exists with that ID");
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteImportItem = async (
  params: deleteImportItemParamsDTO,
): Promise<ImportItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const importItem = await tx.importItem.delete({
        where: { id: params.id },
      });
      await deleteStockMovement(
        tx,
        StockMovementType.IMPORT_ITEM,
        importItem.id,
      );
      return importItem;
    });
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
