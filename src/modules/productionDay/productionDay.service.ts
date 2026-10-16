import { ProductionDay, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createProductionDayBodyDTO,
  deleteProductionDayParamsDTO,
  getProductionDayParamsDTO,
  paginateProductionDaysDTO,
  productionDayRules,
  updateProductionDayBodyDTO,
  updateProductionDayParamsDTO,
} from "./productionDay.validation";
import { paginated } from "../../utils/generalFields";

export const getProductionDays = async (
  pagination: paginateProductionDaysDTO,
): Promise<PaginationType<ProductionDay[]>> => {
  const query = buildQuery(productionDayRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.productionDay.findMany(query),
    prisma.productionDay.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getProductionDay = async (
  params: getProductionDayParamsDTO,
): Promise<ProductionDay> => {
  const productionDay = await prisma.productionDay.findUnique({
    where: { id: params.id },
  });
  if (!productionDay) throw new NotFoundException("ProductionDay not found");
  return productionDay;
};
export const createProductionDay = async (
  body: createProductionDayBodyDTO,
): Promise<ProductionDay> => {
  try {
    const productionDay = await prisma.productionDay.create({ data: body });
    return productionDay;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No week exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateProductionDay = async (
  params: updateProductionDayParamsDTO,
  body: updateProductionDayBodyDTO,
): Promise<ProductionDay> => {
  try {
    const productionDay = await prisma.productionDay.update({
      where: { id: params.id },
      data: body,
    });
    return productionDay;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionDay not found");
      else if (err.code === "P2003")
        throw new ConflictException("No week exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteProductionDay = async (
  params: deleteProductionDayParamsDTO,
): Promise<ProductionDay> => {
  try {
    const productionDay = await prisma.productionDay.delete({
      where: { id: params.id },
    });
    return productionDay;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionDay not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
