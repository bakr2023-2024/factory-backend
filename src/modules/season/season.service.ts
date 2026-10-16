import { Season, Prisma } from "../../db/generated/prisma/client";
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
  createSeasonBodyDTO,
  deleteSeasonParamsDTO,
  getSeasonParamsDTO,
  paginateSeasonsDTO,
  seasonRules,
  updateSeasonBodyDTO,
  updateSeasonParamsDTO,
} from "./season.validation";

export const getSeasons = async (
  pagination: paginateSeasonsDTO,
): Promise<PaginationType<Season[]>> => {
  const query = buildQuery(seasonRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.season.findMany(query),
    prisma.season.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
