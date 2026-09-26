import { Season, Prisma } from "../../db/generated/prisma/client";
import {
  SeasonFindManyArgs,
  SeasonWhereInput,
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
  createSeasonBodyDTO,
  deleteSeasonParamsDTO,
  getSeasonParamsDTO,
  paginateSeasonsDTO,
  updateSeasonBodyDTO,
  updateSeasonParamsDTO,
} from "./season.validation";

export const getSeasons = async (
  pagination: paginateSeasonsDTO,
): Promise<PaginationType<Season[]>> => {
  const { page, size } = pagination;
  const query: SeasonFindManyArgs = {};
  const where: SeasonWhereInput = {};
  const orderBy: Prisma.SeasonOrderByWithRelationInput = {};

  if (pagination.name)
    where.name = { contains: pagination.name, mode: "insensitive" };

  const startDate: Prisma.DateTimeFilter = {};
  if (pagination.sortBy == "startDate") orderBy.startDate = pagination.order;
  if (pagination.startedFrom) startDate.gte = pagination.startedFrom;
  if (pagination.startedTo) startDate.lte = pagination.startedTo;
  if (pagination.startedFrom || pagination.startedTo)
    where.startDate = startDate;
  const endDate: Prisma.DateTimeFilter = {};
  if (pagination.sortBy == "endDate") orderBy.endDate = pagination.order;
  if (pagination.endedFrom) endDate.gte = pagination.endedFrom;
  if (pagination.endedTo) endDate.lte = pagination.endedTo;
  if (pagination.endedFrom || pagination.endedTo) where.endDate = endDate;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.season.findMany(query);
  const totalCount = await prisma.season.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getSeason = async (
  params: getSeasonParamsDTO,
): Promise<Season> => {
  const season = await prisma.season.findUnique({ where: { id: params.id } });
  if (!season) throw new NotFoundException("Season not found");
  return season;
};
export const createSeason = async (
  body: createSeasonBodyDTO,
): Promise<Season> => {
  try {
    const season = await prisma.season.create({ data: body });
    return season;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No season exists with this ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateSeason = async (
  params: updateSeasonParamsDTO,
  body: updateSeasonBodyDTO,
): Promise<Season> => {
  try {
    const season = await prisma.season.update({
      where: { id: params.id },
      data: body,
    });
    return season;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Season not found");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteSeason = async (
  params: deleteSeasonParamsDTO,
): Promise<Season> => {
  try {
    const season = await prisma.season.delete({ where: { id: params.id } });
    return season;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Season not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
