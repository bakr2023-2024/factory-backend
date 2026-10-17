import {
  ExportItem,
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
  createExportItemBodyDTO,
  deleteExportItemParamsDTO,
  exportItemRules,
  getExportItemParamsDTO,
  paginateExportItemsDTO,
  updateExportItemBodyDTO,
  updateExportItemParamsDTO,
} from "./exportItem.validation";

export const getExportItems = async (
  pagination: paginateExportItemsDTO,
): Promise<PaginationType<ExportItem[]>> => {
  const query = buildQuery(exportItemRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.exportItem.findMany(query),
    prisma.exportItem.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
    return await prisma.$transaction(async (tx) => {
      const exportItem = await tx.exportItem.create({
        data: body,
        include: { export: true },
      });
      await createStockMovement(tx, {
        variant: { connect: { id: exportItem.variantId } },
        productionDay: { connect: { id: exportItem.export.productionDayId } },
        type: StockMovementType.EXPORT_ITEM,
        typeRef: exportItem.id,
        quantityChanged: -exportItem.quantity,
      });
      return exportItem;
    });
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
    return await prisma.$transaction(async (tx) => {
      if (body.quantity !== undefined) {
        const exportItem = await tx.exportItem.findUniqueOrThrow({
          where: { id: params.id },
          include: { customerReturnItem: true },
        });
        const returnQuantity = exportItem.customerReturnItem?.quantity;
        if (returnQuantity !== undefined && returnQuantity > body.quantity)
          throw new ConflictException(
            "returned quantity can't be more than exported quantity",
          );
      }
      const updated = await tx.exportItem.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity !== undefined) {
        await updateStockMovement(
          tx,
          StockMovementType.EXPORT_ITEM,
          updated.id,
          -updated.quantity,
        );
      }
      return updated;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ExportItem not found");
      else if (err.code === "P2003")
        throw new ConflictException("No export/variant exists with that ID");
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteExportItem = async (
  params: deleteExportItemParamsDTO,
): Promise<ExportItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const exportItem = await tx.exportItem.delete({
        where: { id: params.id },
      });
      await deleteStockMovement(
        tx,
        StockMovementType.EXPORT_ITEM,
        exportItem.id,
      );
      return exportItem;
    });
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
