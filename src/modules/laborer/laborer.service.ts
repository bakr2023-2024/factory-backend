import { Laborer, Prisma } from "../../db/generated/prisma/client";
import {
  LaborerFindManyArgs,
  LaborerWhereInput,
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
  createLaborerBodyDTO,
  deleteLaborerParamsDTO,
  getLaborerParamsDTO,
  paginateLaborersDTO,
  updateLaborerBodyDTO,
  updateLaborerParamsDTO,
} from "./laborer.validation";

export const getLaborers = async (
  pagination: paginateLaborersDTO,
): Promise<PaginationType<Laborer[]>> => {
  const { page, size } = pagination;
  const query: LaborerFindManyArgs = {};
  const where: LaborerWhereInput = {};
  const orderBy: Prisma.LaborerOrderByWithRelationInput = {};

  // inject fields into query
  if (pagination.name)
    where.name = { contains: pagination.name, mode: "insensitive" };
  if (pagination.number)
    where.number = { contains: pagination.number, mode: "insensitive" };

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.laborer.findMany(query);
  const totalCount = await prisma.laborer.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
