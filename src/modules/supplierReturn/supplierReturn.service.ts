import { SupplierReturn, Prisma } from "../../db/generated/prisma/client";
import {
  SupplierReturnFindManyArgs,
  SupplierReturnWhereInput,
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
  createSupplierReturnBodyDTO,
  deleteSupplierReturnParamsDTO,
  getSupplierReturnParamsDTO,
  paginateSupplierReturnsDTO,
  updateSupplierReturnBodyDTO,
  updateSupplierReturnParamsDTO,
} from "./supplierReturn.validation";

export const getSupplierReturns = async (
  pagination: paginateSupplierReturnsDTO,
): Promise<PaginationType<SupplierReturn[]>> => {
  const { page, size } = pagination;
  const query: SupplierReturnFindManyArgs = {};
  const where: SupplierReturnWhereInput = {};
  const orderBy: Prisma.SupplierReturnOrderByWithRelationInput = {};

  // inject fields into query
  const supplier: Prisma.SupplierWhereInput = {};
  if (pagination.supplierName)
    supplier.name = { contains: pagination.supplierName, mode: "insensitive" };
  if (pagination.supplierNumber) {
    supplier.number = {
      contains: pagination.supplierNumber,
      mode: "insensitive",
    };
  }
  if (pagination.supplierId) where.supplierId = pagination.supplierId;

  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  if (Object.keys(supplier).length) where.supplier = supplier;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.supplierReturn.findMany(query);
  const totalCount = await prisma.supplierReturn.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getSupplierReturn = async (
  params: getSupplierReturnParamsDTO,
): Promise<SupplierReturn> => {
  const supplierReturn = await prisma.supplierReturn.findUnique({
    where: { id: params.id },
  });
  if (!supplierReturn) throw new NotFoundException("SupplierReturn not found");
  return supplierReturn;
};
export const createSupplierReturn = async (
  body: createSupplierReturnBodyDTO,
): Promise<SupplierReturn> => {
  try {
    const supplierReturn = await prisma.supplierReturn.create({ data: body });
    return supplierReturn;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No supplier exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateSupplierReturn = async (
  params: updateSupplierReturnParamsDTO,
  body: updateSupplierReturnBodyDTO,
): Promise<SupplierReturn> => {
  try {
    const supplierReturn = await prisma.supplierReturn.update({
      where: { id: params.id },
      data: body,
    });
    return supplierReturn;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("SupplierReturn not found");
      else if (err.code === "P2003")
        throw new ConflictException("No supplier exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteSupplierReturn = async (
  params: deleteSupplierReturnParamsDTO,
): Promise<SupplierReturn> => {
  try {
    const supplierReturn = await prisma.supplierReturn.delete({
      where: { id: params.id },
    });
    return supplierReturn;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("SupplierReturn not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
