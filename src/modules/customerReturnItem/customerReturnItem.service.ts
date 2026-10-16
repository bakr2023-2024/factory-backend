import {
  CustomerReturnItem,
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
  createCustomerReturnItemBodyDTO,
  customerReturnItemRules,
  deleteCustomerReturnItemParamsDTO,
  getCustomerReturnItemParamsDTO,
  paginateCustomerReturnItemsDTO,
  updateCustomerReturnItemBodyDTO,
  updateCustomerReturnItemParamsDTO,
} from "./customerReturnItem.validation";
import { paginated } from "../../utils/generalFields";

export const getCustomerReturnItems = async (
  pagination: paginateCustomerReturnItemsDTO,
): Promise<PaginationType<CustomerReturnItem[]>> => {
  const query = buildQuery(customerReturnItemRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.customerReturnItem.findMany(query),
    prisma.customerReturnItem.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getCustomerReturnItem = async (
  params: getCustomerReturnItemParamsDTO,
): Promise<CustomerReturnItem> => {
  const customerReturnItem = await prisma.customerReturnItem.findUnique({
    where: { id: params.id },
  });
  if (!customerReturnItem)
    throw new NotFoundException("CustomerReturnItem not found");
  return customerReturnItem;
};
export const createCustomerReturnItem = async (
  body: createCustomerReturnItemBodyDTO,
): Promise<CustomerReturnItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const customerReturnItem = await tx.customerReturnItem.create({
        data: body,
        include: { customerReturn: true, exportItem: true },
      });
      await createStockMovement(tx, {
        variant: { connect: { id: customerReturnItem.exportItem.variantId } },
        productionDay: {
          connect: { id: customerReturnItem.customerReturn.productionDayId },
        },
        occurredAt: customerReturnItem.customerReturn.occurredAt,
        quantityChanged: body.quantity,
        type: StockMovementType.CUSTOMER_RETURN_ITEM,
        typeRef: customerReturnItem.id,
      });
      return customerReturnItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No customerReturn/exportItem exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateCustomerReturnItem = async (
  params: updateCustomerReturnItemParamsDTO,
  body: updateCustomerReturnItemBodyDTO,
): Promise<CustomerReturnItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const customerReturnItem = await prisma.customerReturnItem.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity !== undefined)
        await updateStockMovement(
          tx,
          StockMovementType.CUSTOMER_RETURN_ITEM,
          customerReturnItem.id,
          body.quantity,
        );
      return customerReturnItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("CustomerReturnItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No customerReturn/exportItem exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteCustomerReturnItem = async (
  params: deleteCustomerReturnItemParamsDTO,
): Promise<CustomerReturnItem> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const customerReturnItem = await prisma.customerReturnItem.delete({
        where: { id: params.id },
      });
      await deleteStockMovement(
        tx,
        StockMovementType.CUSTOMER_RETURN_ITEM,
        customerReturnItem.id,
      );
      return customerReturnItem;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("CustomerReturnItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
