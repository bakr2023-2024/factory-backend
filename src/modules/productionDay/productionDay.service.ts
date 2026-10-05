import { ProductionDay, Prisma } from "../../db/generated/prisma/client";
import {
  ProductionDayFindManyArgs,
  ProductionDayWhereInput,
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
  createProductionDayBodyDTO,
  deleteProductionDayParamsDTO,
  getProductionDayParamsDTO,
  paginateProductionDaysDTO,
  updateProductionDayBodyDTO,
  updateProductionDayParamsDTO,
} from "./productionDay.validation";

export const getProductionDays = async (
  pagination: paginateProductionDaysDTO,
): Promise<PaginationType<ProductionDay[]>> => {
  const { page, size } = pagination;
  const query: ProductionDayFindManyArgs = {};
  const where: ProductionDayWhereInput = {};
  const orderBy: Prisma.ProductionDayOrderByWithRelationInput = {};

  // inject fields into query

  const startedAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy == "startedAt") orderBy.startedAt = pagination.order;
  if (pagination.startedFrom) startedAt.gte = pagination.startedFrom;
  if (pagination.startedTo) startedAt.lte = pagination.startedTo;
  if (pagination.startedFrom || pagination.startedTo)
    where.startedAt = startedAt;
  const endedAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy == "endedAt") orderBy.endedAt = pagination.order;
  if (pagination.endedFrom) endedAt.gte = pagination.endedFrom;
  if (pagination.endedTo) endedAt.lte = pagination.endedTo;
  if (pagination.endedFrom || pagination.endedTo) where.endedAt = endedAt;
  if (pagination.sortBy == "productionDate")
    orderBy.productionDate = pagination.order;
  if (pagination.productionDate)
    where.productionDate = pagination.productionDate;
  if (pagination.weekId) where.weekId = pagination.weekId;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.productionDay.findMany(query);
  const totalCount = await prisma.productionDay.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
