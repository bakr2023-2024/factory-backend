import { Import, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { paginated } from "../../utils/generalFields";
import { PaginationType } from "../../utils/types/types";
import { buildQuery } from "../../utils/utils";
import {
  createImportBodyDTO,
  deleteImportParamsDTO,
  getImportParamsDTO,
  importRules,
  paginateImportsDTO,
  updateImportBodyDTO,
  updateImportParamsDTO,
} from "./import.validation";

export const getImports = async (
  pagination: paginateImportsDTO,
): Promise<PaginationType<Import[]>> => {
  const query = buildQuery(importRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.import.findMany(query),
    prisma.import.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
        throw new ConflictException(
          "No supplier/productionDay exists with that ID",
        );
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
        throw new ConflictException(
          "No supplier/productionDay exists with that ID",
        );
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
