import { Rate, Prisma } from "../../db/generated/prisma/client";
import {
  RateFindManyArgs,
  RateWhereInput,
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
  createRateBodyDTO,
  deleteRateParamsDTO,
  getRateParamsDTO,
  paginateRatesDTO,
  updateRateBodyDTO,
  updateRateParamsDTO,
} from "./rate.validation";

export const getRates = async (
  pagination: paginateRatesDTO,
): Promise<PaginationType<Rate[]>> => {
  const { page, size } = pagination;
  const query: RateFindManyArgs = {};
  const where: RateWhereInput = {};
  const orderBy: Prisma.RateOrderByWithRelationInput = {};
  const dailySalary: Prisma.DecimalFilter = {};
  const laborer: Prisma.LaborerWhereInput = {};
  if (pagination.laborerId) where.laborerId = pagination.laborerId;
  if (pagination.laborerName) laborer.name = { contains: pagination.laborerName, mode: "insensitive" }
  if (pagination.laborerNumber) laborer.number ={ contains: pagination.laborerNumber, mode: "insensitive" }
  if (pagination.seasonId) where.seasonId = pagination.seasonId;
  if (pagination.from) where.from = { gte: pagination.from };
  if (pagination.to) where.to = { lte: pagination.to };
  if (pagination.paymentType) where.paymentType = pagination.paymentType;

  if (pagination.minSalary) dailySalary.gte = pagination.minSalary;
  if (pagination.maxSalary) dailySalary.lte = pagination.maxSalary;
  if (Object.keys(dailySalary).length) where.dailySalary = dailySalary;
  if (Object.keys(laborer).length) where.laborer = laborer;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.rate.findMany(query);
  const totalCount = await prisma.rate.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getRate = async (params: getRateParamsDTO): Promise<Rate> => {
  const rate = await prisma.rate.findUnique({
    where: { id: params.id },
  });
  if (!rate) throw new NotFoundException("Rate not found");
  return rate;
};
export const createRate = async (body: createRateBodyDTO): Promise<Rate> => {
  try {
    const rate = await prisma.rate.create({ data: body });
    return rate;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No laborer/season exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateRate = async (
  params: updateRateParamsDTO,
  body: updateRateBodyDTO,
): Promise<Rate> => {
  try {
    const rate = await prisma.rate.update({
      where: { id: params.id },
      data: body,
    });
    return rate;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Rate not found");
      else if (err.code === "P2003")
        throw new ConflictException("No laborer/season exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteRate = async (
  params: deleteRateParamsDTO,
): Promise<Rate> => {
  try {
    const rate = await prisma.rate.delete({
      where: { id: params.id },
    });
    return rate;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Rate not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
