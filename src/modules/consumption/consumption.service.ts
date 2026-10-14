import {
  Consumption,
  Prisma,
  StockMovementType,
} from "../../db/generated/prisma/client";
import {
  ConsumptionFindManyArgs,
  ConsumptionWhereInput,
  VariantWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import {
  buildQuery,
  createStockMovement,
  deleteStockMovement,
  updateStockMovement,
} from "../../utils/utils";
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
  const variant: VariantWhereInput = {};
  if (pagination.productionDayId)
    where.productionDayId = pagination.productionDayId;
  if (pagination.variantId) where.variantId = pagination.variantId;
  if (pagination.productionDate)
    where.productionDay = { productionDate: pagination.productionDate };
  if (pagination.itemName)
    variant.item = {
      name: { contains: pagination.itemName, mode: "insensitive" },
    };
  if (pagination.unitWeight) variant.unitWeight = pagination.unitWeight;
  if (pagination.quantity) where.quantity = pagination.quantity;

  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  if (Object.keys(variant).length > 0) where.variant = variant;

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
    return await prisma.$transaction(async (tx) => {
      const consumption = await tx.consumption.create({ data: body });
      await createStockMovement(tx, {
        variant: { connect: { id: consumption.variantId } },
        occurredAt: consumption.occurredAt,
        productionDay: {connect:{id:consumption.productionDayId}},
        quantityChanged: -consumption.quantity,
        type: StockMovementType.CONSUMPTION,
        typeRef: consumption.id,
      });
      return consumption;
    });
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
    return await prisma.$transaction(async (tx) => {
      const consumption = await prisma.consumption.update({
        where: { id: params.id },
        data: body,
      });
      if (body.quantity !== undefined)
        await updateStockMovement(
          tx,
          StockMovementType.CONSUMPTION,
          consumption.id,
          -consumption.quantity,
        );
      return consumption;
    });
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
    return await prisma.$transaction(async (tx) => {
      const consumption = await prisma.consumption.delete({
        where: { id: params.id },
      });
      await deleteStockMovement(
        tx,
        StockMovementType.CONSUMPTION,
        consumption.id,
      );
      return consumption;
    });
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
