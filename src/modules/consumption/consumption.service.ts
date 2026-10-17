import {
  Consumption,
  Prisma,
  StockMovementType,
} from "../../db/generated/prisma/client";
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
  consumptionRules,
  createConsumptionBodyDTO,
  deleteConsumptionParamsDTO,
  getConsumptionParamsDTO,
  paginateConsumptionsDTO,
  updateConsumptionBodyDTO,
  updateConsumptionParamsDTO,
} from "./consumption.validation";
import { paginated } from "../../utils/generalFields";

export const getConsumptions = async (
  pagination: paginateConsumptionsDTO,
): Promise<PaginationType<Consumption[]>> => {
  const query = buildQuery(consumptionRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.consumption.findMany(query),
    prisma.consumption.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
      const consumption = await tx.consumption.update({
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
      const consumption = await tx.consumption.delete({
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
