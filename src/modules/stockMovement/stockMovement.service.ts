import { StockMovement, Prisma } from "../../db/generated/prisma/client";
import {
  StockMovementFindManyArgs,
  StockMovementWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import { NotFoundException } from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  getStockMovementParamsDTO,
  paginateStockMovementsDTO,
} from "./stockMovement.validation";

export const getStockMovements = async (
  pagination: paginateStockMovementsDTO,
): Promise<PaginationType<StockMovement[]>> => {
  const { page, size } = pagination;
  const query: StockMovementFindManyArgs = {};
  const where: StockMovementWhereInput = {};
  const orderBy: Prisma.StockMovementOrderByWithRelationInput = {};

  // inject fields into query
  if (pagination.itemName)
    where.variant = {
      item: { name: { contains: pagination.itemName, mode: "insensitive" } },
    };
  if (pagination.variantId) where.variantId = pagination.variantId;
  if (pagination.quantityChanged)
    where.quantityChanged = pagination.quantityChanged;
  if (pagination.type) where.type = pagination.type;
  if (pagination.type && pagination.typeRef) where.typeRef = pagination.typeRef;

  const occurredAt: Prisma.DateTimeFilter = {};
  if (pagination.sortBy && pagination.sortBy == "occurredAt")
    orderBy.occurredAt = pagination.order;
  if (pagination.occurredFrom) occurredAt.gte = pagination.occurredFrom;
  if (pagination.occurredTo) occurredAt.lte = pagination.occurredTo;
  if (pagination.occurredFrom || pagination.occurredTo)
    where.occurredAt = occurredAt;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.stockMovement.findMany(query);
  const totalCount = await prisma.stockMovement.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
