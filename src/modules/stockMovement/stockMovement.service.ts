import { StockMovement, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import { NotFoundException } from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  getStockMovementParamsDTO,
  paginateStockMovementsDTO,
  stockMovementRules,
} from "./stockMovement.validation";
import { paginated } from "../../utils/generalFields";

export const getStockMovements = async (
  pagination: paginateStockMovementsDTO,
): Promise<PaginationType<StockMovement[]>> => {
  const query = buildQuery(stockMovementRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.stockMovement.findMany(query),
    prisma.stockMovement.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getStockMovement = async (
  params: getStockMovementParamsDTO,
): Promise<StockMovement> => {
  const stockMovement = await prisma.stockMovement.findUnique({
    where: { id: params.id },
  });
  if (!stockMovement) throw new NotFoundException("StockMovement not found");
  return stockMovement;
};
