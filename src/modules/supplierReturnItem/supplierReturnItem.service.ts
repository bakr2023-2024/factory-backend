import {
  SupplierReturnItem,
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
  updateStockMovement,
  deleteStockMovement,
} from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createSupplierReturnItemBodyDTO,
  deleteSupplierReturnItemParamsDTO,
  getSupplierReturnItemParamsDTO,
  paginateSupplierReturnItemsDTO,
  supplierReturnItemRules,
  updateSupplierReturnItemBodyDTO,
  updateSupplierReturnItemParamsDTO,
} from "./supplierReturnItem.validation";
import { paginated } from "../../utils/generalFields";

export const getSupplierReturnItems = async (
  pagination: paginateSupplierReturnItemsDTO,
): Promise<PaginationType<SupplierReturnItem[]>> => {
  const query = buildQuery(supplierReturnItemRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.supplierReturnItem.findMany(query),
    prisma.supplierReturnItem.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getSupplierReturnItem = async (
  params: getSupplierReturnItemParamsDTO,
): Promise<SupplierReturnItem> => {
  const supplierReturnItem = await prisma.supplierReturnItem.findUnique({
    where: { id: params.id },
  });
  if (!supplierReturnItem)
    throw new NotFoundException("SupplierReturnItem not found");
  return supplierReturnItem;
};
export const createSupplierReturnItem = async (
  body: createSupplierReturnItemBodyDTO,
): Promise<SupplierReturnItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const supplierReturnItem = await prisma.supplierReturnItem.create({
        data: body,
        include: { importItem: true, supplierReturn: true },
      });
      await createStockMovement(tx, {
        variant: { connect: { id: supplierReturnItem.importItem.variantId } },
        productionDay:{connect:{id:supplierReturnItem.supplierReturn.productionDayId}},
        occurredAt: supplierReturnItem.supplierReturn.occurredAt,
        type: StockMovementType.SUPPLIER_RETURN_ITEM,
        typeRef: supplierReturnItem.id,
        quantityChanged: -supplierReturnItem.quantity,
      });
      return supplierReturnItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No supplierReturn/importItem exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateSupplierReturnItem = async (
  params: updateSupplierReturnItemParamsDTO,
  body: updateSupplierReturnItemBodyDTO,
): Promise<SupplierReturnItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const supplierReturnItem = await prisma.supplierReturnItem.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity !== undefined)
        await updateStockMovement(
          tx,
          StockMovementType.SUPPLIER_RETURN_ITEM,
          supplierReturnItem.id,
          -supplierReturnItem.quantity,
        );
      return supplierReturnItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("SupplierReturnItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No supplierReturn/importItem exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteSupplierReturnItem = async (
  params: deleteSupplierReturnItemParamsDTO,
): Promise<SupplierReturnItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const supplierReturnItem = await prisma.supplierReturnItem.delete({
        where: { id: params.id },
      });
      await deleteStockMovement(
        tx,
        StockMovementType.SUPPLIER_RETURN_ITEM,
        supplierReturnItem.id,
      );
      return supplierReturnItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("SupplierReturnItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
