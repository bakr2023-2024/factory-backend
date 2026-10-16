import { Week, Prisma } from "../../db/generated/prisma/client";
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
  createWeekBodyDTO,
  deleteWeekParamsDTO,
  getWeekParamsDTO,
  paginateWeeksDTO,
  updateWeekBodyDTO,
  updateWeekParamsDTO,
  weekRules,
} from "./week.validation";

export const getWeeks = async (
  pagination: paginateWeeksDTO,
): Promise<PaginationType<Week[]>> => {
  const query = buildQuery(weekRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.week.findMany(query),
    prisma.week.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getWeek = async (params: getWeekParamsDTO): Promise<Week> => {
  const week = await prisma.week.findUnique({ where: { id: params.id } });
  if (!week) throw new NotFoundException("Week not found");
  return week;
};
export const createWeek = async (body: createWeekBodyDTO): Promise<Week> => {
  try {
    const week = await prisma.week.create({ data: body });
    return week;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No season exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateWeek = async (
  params: updateWeekParamsDTO,
  body: updateWeekBodyDTO,
): Promise<Week> => {
  try {
    const week = await prisma.week.update({
      where: { id: params.id },
      data: body,
    });
    return week;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Week not found");
      else if (err.code === "P2003")
        throw new ConflictException("No season exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteWeek = async (
  params: deleteWeekParamsDTO,
): Promise<Week> => {
  try {
    const week = await prisma.week.delete({ where: { id: params.id } });
    return week;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Week not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
