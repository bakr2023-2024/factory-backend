import { Export, Prisma } from "../../db/generated/prisma/client";
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
  createExportBodyDTO,
  deleteExportParamsDTO,
  exportRules,
  getExportParamsDTO,
  paginateExportsDTO,
  updateExportBodyDTO,
  updateExportParamsDTO,
} from "./export.validation";

export const getExports = async (
  pagination: paginateExportsDTO,
): Promise<PaginationType<Export[]>> => {
  const query = buildQuery(exportRules,pagination)
  const [data,totalCount] = await Promise.all([prisma.export.findMany(query),prisma.export.count({where:query.where})])
  return paginated(data,pagination,totalCount)
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
        throw new ConflictException(
          "No customer/productionDay exists with this ID",
        );
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
        throw new ConflictException(
          "No customer/productionDay exists with that ID",
        );
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
