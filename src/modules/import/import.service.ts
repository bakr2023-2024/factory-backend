import { Import, Prisma } from "../../db/generated/prisma/client";
import { ImportWhereInput } from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import {
  createImportBodyDTO,
  deleteImportParamsDTO,
  getImportParamsDTO,
  paginateImportsDTO,
  updateImportBodyDTO,
  updateImportParamsDTO,
} from "./import.validation";

export const getImports = async (
  pagination: paginateImportsDTO,
): Promise<PaginationType<Import[]>> => {
  const { page, size } = pagination;
  const where: ImportWhereInput = {};
  if (pagination.supplierId) where.supplierId = pagination.supplierId;
  if (pagination.createdFrom && pagination.createdTo)
    where.createdAt = { gte: pagination.createdFrom, lt: pagination.createdTo };
  const query = {
    skip: (page - 1) * pagination.size,
    take: size,
    where,
  };
  const data = await prisma.import.findMany(query);
  const totalCount = await prisma.import.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getImport = async (
  params: getImportParamsDTO,
): Promise<Import> => {
  const importe = await prisma.import.findUnique({ where: { id: params.id } });
  if (!importe) throw new NotFoundException("Import not found");
  return importe;
};
export const createImport = async (
  body: createImportBodyDTO,
): Promise<Import> => {
  try {
    const importe = await prisma.import.create({ data: body });
    return importe;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No supplier exists with this ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateImport = async (
  params: updateImportParamsDTO,
  body: updateImportBodyDTO,
): Promise<Import> => {
  try {
    const importe = await prisma.import.update({
      where: { id: params.id },
      data: body,
    });
    return importe;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Import not found");
      else if (err.code === "P2003")
        throw new ConflictException("No supplier exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteImport = async (
  params: deleteImportParamsDTO,
): Promise<Import> => {
  try {
    const importe = await prisma.import.delete({ where: { id: params.id } });
    return importe;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Import not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
