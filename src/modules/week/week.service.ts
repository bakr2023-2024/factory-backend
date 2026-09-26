import { Week, Prisma } from "../../db/generated/prisma/client";
import {
  WeekFindManyArgs,
  WeekWhereInput,
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
  createWeekBodyDTO,
  deleteWeekParamsDTO,
  getWeekParamsDTO,
  paginateWeeksDTO,
  updateWeekBodyDTO,
  updateWeekParamsDTO,
} from "./week.validation";

export const getWeeks = async (
  pagination: paginateWeeksDTO,
): Promise<PaginationType<Week[]>> => {
  const { page, size } = pagination;
  const query: WeekFindManyArgs = {};
  const where: WeekWhereInput = {};
  const orderBy: Prisma.WeekOrderByWithRelationInput = {};

  if (pagination.seasonName)
    where.season = {
      name: { contains: pagination.seasonName, mode: "insensitive" },
    };
  if (pagination.seasonId) where.seasonId = pagination.seasonId;

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

  const data = await prisma.week.findMany(query);
  const totalCount = await prisma.week.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
        throw new ConflictException("No season exists with this ID");
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
