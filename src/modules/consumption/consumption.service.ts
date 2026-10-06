import { Consumption, Prisma } from "../../db/generated/prisma/client";
import {
  ConsumptionFindManyArgs,
  ConsumptionWhereInput,
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
  createConsumptionBodyDTO,
  deleteConsumptionParamsDTO,
  getConsumptionParamsDTO,
  paginateConsumptionsDTO,
  updateConsumptionBodyDTO,
  updateConsumptionParamsDTO,
} from "./consumption.validation";

export const getConsumptions = async (
  pagination: paginateConsumptionsDTO,
): Promise<PaginationType<Consumption[]>> => {
  const { page, size } = pagination;
  const query: ConsumptionFindManyArgs = {};
  const where: ConsumptionWhereInput = {};
  const orderBy: Prisma.ConsumptionOrderByWithRelationInput = {};

  // inject fields into query
  if (pagination.productionDayId)
    where.productionDayId = pagination.productionDayId;
  if (pagination.variantId) where.variantId = pagination.variantId;
  if (pagination.productionDate)
    where.productionDay = { productionDate: pagination.productionDate };
  if (pagination.itemName)
    where.variant = {
      item: { name: { contains: pagination.itemName, mode: "insensitive" } },
    };
  if (pagination.unitWeight) {
    if (where.variant) where.variant.unitWeight = pagination.unitWeight;
    else where.variant = { unitWeight: pagination.unitWeight };
  }
  if (pagination.quantity) where.quantity = pagination.quantity;

  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.consumption.findMany(query);
  const totalCount = await prisma.consumption.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getConsumption = async (
  params: getConsumptionParamsDTO,
): Promise<Consumption> => {
  const consumption = await prisma.consumption.findUnique({
    where: { id: params.id },
  });
  if (!consumption) throw new NotFoundException("Consumption not found");
  return consumption;
};
export const createConsumption = async (
  body: createConsumptionBodyDTO,
): Promise<Consumption> => {
  try {
    const consumption = await prisma.consumption.create({ data: body });
    return consumption;
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
export const updateConsumption = async (
  params: updateConsumptionParamsDTO,
  body: updateConsumptionBodyDTO,
): Promise<Consumption> => {
  try {
    const consumption = await prisma.consumption.update({
      where: { id: params.id },
      data: body,
    });
    return consumption;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Consumption not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No productionDay/variant exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteConsumption = async (
  params: deleteConsumptionParamsDTO,
): Promise<Consumption> => {
  try {
    const consumption = await prisma.consumption.delete({
      where: { id: params.id },
    });
    return consumption;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Consumption not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
