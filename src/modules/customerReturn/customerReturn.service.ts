import { CustomerReturn, Prisma } from "../../db/generated/prisma/client";
import {
  CustomerReturnFindManyArgs,
  CustomerReturnWhereInput,
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
  createCustomerReturnBodyDTO,
  deleteCustomerReturnParamsDTO,
  getCustomerReturnParamsDTO,
  paginateCustomerReturnsDTO,
  updateCustomerReturnBodyDTO,
  updateCustomerReturnParamsDTO,
} from "./customerReturn.validation";

export const getCustomerReturns = async (
  pagination: paginateCustomerReturnsDTO,
): Promise<PaginationType<CustomerReturn[]>> => {
  const { page, size } = pagination;
  const query: CustomerReturnFindManyArgs = {};
  const where: CustomerReturnWhereInput = {};
  const orderBy: Prisma.CustomerReturnOrderByWithRelationInput = {};

  // inject fields into query
  const customer: Prisma.CustomerWhereInput = {};
  if (pagination.customerName)
    customer.name = { contains: pagination.customerName, mode: "insensitive" };
  if (pagination.customerNumber)
    customer.number = {
      contains: pagination.customerNumber,
      mode: "insensitive",
    };
  if (pagination.customerId) where.customerId = pagination.customerId;
  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  if (Object.keys(customer).length) where.customer = customer;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.customerReturn.findMany(query);
  const totalCount = await prisma.customerReturn.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getCustomerReturn = async (
  params: getCustomerReturnParamsDTO,
): Promise<CustomerReturn> => {
  const customerReturn = await prisma.customerReturn.findUnique({
    where: { id: params.id },
  });
  if (!customerReturn) throw new NotFoundException("CustomerReturn not found");
  return customerReturn;
};
export const createCustomerReturn = async (
  body: createCustomerReturnBodyDTO,
): Promise<CustomerReturn> => {
  try {
    const customerReturn = await prisma.customerReturn.create({ data: body });
    return customerReturn;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No customer exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateCustomerReturn = async (
  params: updateCustomerReturnParamsDTO,
  body: updateCustomerReturnBodyDTO,
): Promise<CustomerReturn> => {
  try {
    const customerReturn = await prisma.customerReturn.update({
      where: { id: params.id },
      data: body,
    });
    return customerReturn;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("CustomerReturn not found");
      else if (err.code === "P2003")
        throw new ConflictException("No customer exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteCustomerReturn = async (
  params: deleteCustomerReturnParamsDTO,
): Promise<CustomerReturn> => {
  try {
    const customerReturn = await prisma.customerReturn.delete({
      where: { id: params.id },
    });
    return customerReturn;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("CustomerReturn not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
