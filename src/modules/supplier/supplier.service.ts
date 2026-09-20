import { Supplier, Prisma } from "../../db/generated/prisma/client";
import {
  SupplierFindManyArgs,
  SupplierWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import { buildQuery } from "../../utils/utils";
import {
  createSupplierBodyDTO,
  deleteSupplierParamsDTO,
  getSupplierParamsDTO,
  paginateSuppliersDTO,
  updateSupplierBodyDTO,
  updateSupplierParamsDTO,
} from "./supplier.validation";

export const getSuppliers = async (
  pagination: paginateSuppliersDTO,
): Promise<PaginationType<Supplier[]>> => {
  const { page, size } = pagination;
  const query: SupplierFindManyArgs = {};
  const where: SupplierWhereInput = {};
  const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
  buildQuery(pagination, query, where, orderBy);

  if (pagination.name)
    where.name = { contains: pagination.name, mode: "insensitive" };
  if (pagination.number)
    where.number = { contains: pagination.number, mode: "insensitive" };

  const data = await prisma.supplier.findMany(query);
  const totalCount = await prisma.supplier.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getSupplier = async (
  params: getSupplierParamsDTO,
): Promise<Supplier> => {
  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
  });
  if (!supplier) throw new NotFoundException("Supplier not found");
  return supplier;
};
export const createSupplier = async (
  body: createSupplierBodyDTO,
): Promise<Supplier> => {
  try {
    const supplier = await prisma.supplier.create({ data: body });
    return supplier;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No supplier exists with this ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateSupplier = async (
  params: updateSupplierParamsDTO,
  body: updateSupplierBodyDTO,
): Promise<Supplier> => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: body,
    });
    return supplier;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Supplier not found");
      else if (err.code === "P2003")
        throw new ConflictException("No supplier exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteSupplier = async (
  params: deleteSupplierParamsDTO,
): Promise<Supplier> => {
  try {
    const supplier = await prisma.supplier.delete({ where: { id: params.id } });
    return supplier;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Supplier not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
