import { SupplierReturn, Prisma } from "../../db/generated/prisma/client";
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
  supplierReturnRules,
  updateSupplierReturnBodyDTO,
  updateSupplierReturnParamsDTO,
} from "./supplierReturn.validation";
import { paginated } from "../../utils/generalFields";

export const getSupplierReturns = async (
  pagination: paginateSupplierReturnsDTO,
): Promise<PaginationType<SupplierReturn[]>> => {
  const query = buildQuery(supplierReturnRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.supplierReturn.findMany(query),
    prisma.supplierReturn.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
        throw new ConflictException(
          "No supplier/productionDay exists with that ID",
        );
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
        throw new ConflictException(
          "No supplier/productionDay exists with that ID",
        );
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
