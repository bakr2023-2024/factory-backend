import { CustomerReturn, Prisma } from "../../db/generated/prisma/client";
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
  customerReturnRules,
  deleteCustomerReturnParamsDTO,
  getCustomerReturnParamsDTO,
  paginateCustomerReturnsDTO,
  updateCustomerReturnBodyDTO,
  updateCustomerReturnParamsDTO,
} from "./customerReturn.validation";
import { paginated } from "../../utils/generalFields";

export const getCustomerReturns = async (
  pagination: paginateCustomerReturnsDTO,
): Promise<PaginationType<CustomerReturn[]>> => {
  const query = buildQuery(customerReturnRules,pagination)
  const [data,totalCount] = await Promise.all([prisma.customerReturn.findMany(query),prisma.customerReturn.count({where:query.where})])
  return paginated(data,pagination,totalCount)
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
        throw new ConflictException(
          "No customer/productionDay exists with that ID",
        );
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
        throw new ConflictException(
          "No customer/productionDay exists with that ID",
        );
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
