import { Rate, Prisma } from "../../db/generated/prisma/client";
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
  rateRules,
  updateRateBodyDTO,
  updateRateParamsDTO,
} from "./rate.validation";
import { paginated } from "../../utils/generalFields";

export const getRates = async (
  pagination: paginateRatesDTO,
): Promise<PaginationType<Rate[]>> => {
  const query = buildQuery(rateRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.rate.findMany(query),
    prisma.rate.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
