import { Laborer, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createLaborerBodyDTO,
  deleteLaborerParamsDTO,
  getLaborerParamsDTO,
  laborerRules,
  paginateLaborersDTO,
  updateLaborerBodyDTO,
  updateLaborerParamsDTO,
} from "./laborer.validation";
import { paginated } from "../../utils/generalFields";

export const getLaborers = async (
  pagination: paginateLaborersDTO,
): Promise<PaginationType<Laborer[]>> => {
  const query = buildQuery(laborerRules,pagination)
  const [data,totalCount] = await Promise.all([prisma.laborer.findMany(query),prisma.laborer.count({where:query.where})])
  return paginated(data,pagination,totalCount)
};
export const getLaborer = async (
  params: getLaborerParamsDTO,
): Promise<Laborer> => {
  const laborer = await prisma.laborer.findUnique({
    where: { id: params.id },
  });
  if (!laborer) throw new NotFoundException("Laborer not found");
  return laborer;
};
export const createLaborer = async (
  body: createLaborerBodyDTO,
): Promise<Laborer> => {
  try {
    const laborer = await prisma.laborer.create({ data: body });
    return laborer;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No productionDay/variant exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateLaborer = async (
  params: updateLaborerParamsDTO,
  body: updateLaborerBodyDTO,
): Promise<Laborer> => {
  try {
    const laborer = await prisma.laborer.update({
      where: { id: params.id },
      data: body,
    });
    return laborer;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Laborer not found");
      else if (err.code === "P2003")
        throw new ConflictException("No laborer exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteLaborer = async (
  params: deleteLaborerParamsDTO,
): Promise<Laborer> => {
  try {
    const laborer = await prisma.laborer.delete({
      where: { id: params.id },
    });
    return laborer;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Laborer not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
