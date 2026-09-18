import { Customer, Prisma } from "../../db/generated/prisma/client";
import { CustomerWhereInput } from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import {
  createCustomerBodyDTO,
  deleteCustomerParamsDTO,
  getCustomerParamsDTO,
  paginateCustomersDTO,
  updateCustomerBodyDTO,
  updateCustomerParamsDTO,
} from "./customer.validation";

export const getCustomers = async (
  pagination: paginateCustomersDTO,
): Promise<PaginationType<Customer[]>> => {
  const { page, size } = pagination;
  const where: CustomerWhereInput = {};
  if (pagination.name)
    where.name = { contains: pagination.name, mode: "insensitive" };
  if (pagination.number) where.number = pagination.number;
  const query = {
    skip: (page - 1) * pagination.size,
    take: size,
    where,
  };
  const data = await prisma.customer.findMany(query);
  const totalCount = await prisma.customer.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getCustomer = async (
  params: getCustomerParamsDTO,
): Promise<Customer> => {
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
  });
  if (!customer) throw new NotFoundException("Customer not found");
  return customer;
};
export const createCustomer = async (
  body: createCustomerBodyDTO,
): Promise<Customer> => {
  try {
    const customer = await prisma.customer.create({ data: body });
    return customer;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No customer exists with this ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateCustomer = async (
  params: updateCustomerParamsDTO,
  body: updateCustomerBodyDTO,
): Promise<Customer> => {
  try {
    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: body,
    });
    return customer;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Customer not found");
      else if (err.code === "P2003")
        throw new ConflictException("No customer exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteCustomer = async (
  params: deleteCustomerParamsDTO,
): Promise<Customer> => {
  try {
    const customer = await prisma.customer.delete({ where: { id: params.id } });
    return customer;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Customer not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
