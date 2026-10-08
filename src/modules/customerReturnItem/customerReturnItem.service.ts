import { CustomerReturnItem, Prisma } from "../../db/generated/prisma/client";
import {
  CustomerReturnItemFindManyArgs,
  CustomerReturnItemWhereInput,
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
  createCustomerReturnItemBodyDTO,
  deleteCustomerReturnItemParamsDTO,
  getCustomerReturnItemParamsDTO,
  paginateCustomerReturnItemsDTO,
  updateCustomerReturnItemBodyDTO,
  updateCustomerReturnItemParamsDTO,
} from "./customerReturnItem.validation";

export const getCustomerReturnItems = async (
  pagination: paginateCustomerReturnItemsDTO,
): Promise<PaginationType<CustomerReturnItem[]>> => {
  const { page, size } = pagination;
  const query: CustomerReturnItemFindManyArgs = {};
  const where: CustomerReturnItemWhereInput = {};
  const orderBy: Prisma.CustomerReturnItemOrderByWithRelationInput = {};

  // inject fields into query
  const customerReturn: Prisma.CustomerReturnWhereInput = {};
  const exportItem: Prisma.ExportItemWhereInput = {};
  const unitPrice: Prisma.DecimalFilter = {};
  if (pagination.customerReturnId)
    where.customerReturnId = pagination.customerReturnId;
  if (pagination.exportItemId) where.exportItemId = pagination.exportItemId;
  if (pagination.customerId) customerReturn.customerId = pagination.customerId;
  if (pagination.customerName) {
    customerReturn.customer = {
      name: { contains: pagination.customerName, mode: "insensitive" },
    };
  }
  if (pagination.customerNumber) {
    if (customerReturn.customer)
      customerReturn.customer.number = {
        contains: pagination.customerNumber,
        mode: "insensitive",
      };
    else
      customerReturn.customer = {
        number: { contains: pagination.customerNumber, mode: "insensitive" },
      };
  }
  if (pagination.itemName)
    exportItem.variant = {
      item: { name: { contains: pagination.itemName, mode: "insensitive" } },
    };
  if (pagination.unitWeight) {
    if (exportItem.variant)
      exportItem.variant.unitWeight = pagination.unitWeight;
    else exportItem.variant = { unitWeight: pagination.unitWeight };
  }
  if (pagination.quantity) where.quantity = pagination.quantity;
  if (pagination.minPrice) unitPrice.gte = pagination.minPrice;
  if (pagination.maxPrice) unitPrice.lte = pagination.maxPrice;
  if (Object.keys(customerReturn).length) where.customerReturn = customerReturn;
  if (Object.keys(exportItem).length) where.exportItem = exportItem;
  if (Object.keys(unitPrice).length) where.unitPrice = unitPrice;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.customerReturnItem.findMany(query);
  const totalCount = await prisma.customerReturnItem.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
    const customerReturnItem = await prisma.customerReturnItem.create({
      data: body,
    });
    return customerReturnItem;
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
    const customerReturnItem = await prisma.customerReturnItem.update({
      where: { id: params.id },
      data: body,
    });
    return customerReturnItem;
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
    const customerReturnItem = await prisma.customerReturnItem.delete({
      where: { id: params.id },
    });
    return customerReturnItem;
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
