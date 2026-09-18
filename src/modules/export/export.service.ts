import { Export, Prisma } from "../../db/generated/prisma/client";
import { ExportWhereInput } from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import {
  createExportBodyDTO,
  deleteExportParamsDTO,
  getExportParamsDTO,
  paginateExportsDTO,
  updateExportBodyDTO,
  updateExportParamsDTO,
} from "./export.validation";

export const getExports = async (
  pagination: paginateExportsDTO,
): Promise<PaginationType<Export[]>> => {
  const { page, size } = pagination;
  const where: ExportWhereInput = {};
  if (pagination.customerId) where.customerId = pagination.customerId;
  if (pagination.createdFrom && pagination.createdTo)
    where.createdAt = { gte: pagination.createdFrom, lt: pagination.createdTo };
  const query = {
    skip: (page - 1) * pagination.size,
    take: size,
    where,
  };
  const data = await prisma.export.findMany(query);
  const totalCount = await prisma.export.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getExport = async (
  params: getExportParamsDTO,
): Promise<Export> => {
  const exporte = await prisma.export.findUnique({ where: { id: params.id } });
  if (!exporte) throw new NotFoundException("Export not found");
  return exporte;
};
export const createExport = async (
  body: createExportBodyDTO,
): Promise<Export> => {
  try {
    const exporte = await prisma.export.create({ data: body });
    return exporte;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No customer exists with this ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateExport = async (
  params: updateExportParamsDTO,
  body: updateExportBodyDTO,
): Promise<Export> => {
  try {
    const exporte = await prisma.export.update({
      where: { id: params.id },
      data: body,
    });
    return exporte;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Export not found");
      else if (err.code === "P2003")
        throw new ConflictException("No customer exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteExport = async (
  params: deleteExportParamsDTO,
): Promise<Export> => {
  try {
    const exporte = await prisma.export.delete({ where: { id: params.id } });
    return exporte;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Export not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
