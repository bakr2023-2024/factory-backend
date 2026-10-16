import { ProductionEntry, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createProductionEntryBodyDTO,
  deleteProductionEntryParamsDTO,
  getProductionEntryParamsDTO,
  paginateProductionEntriesDTO,
  productionEntryRules,
  updateProductionEntryBodyDTO,
  updateProductionEntryParamsDTO,
} from "./productionEntry.validation";
import { paginated } from "../../utils/generalFields";

export const getProductionEntries = async (
  pagination: paginateProductionEntriesDTO,
): Promise<PaginationType<ProductionEntry[]>> => {
  const query = buildQuery(productionEntryRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.productionEntry.findMany(query),
    prisma.productionEntry.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getProductionEntry = async (
  params: getProductionEntryParamsDTO,
): Promise<ProductionEntry> => {
  const productionEntry = await prisma.productionEntry.findUnique({
    where: { id: params.id },
  });
  if (!productionEntry)
    throw new NotFoundException("ProductionEntry not found");
  return productionEntry;
};
export const createProductionEntry = async (
  body: createProductionEntryBodyDTO,
): Promise<ProductionEntry> => {
  try {
    const productionEntry = await prisma.productionEntry.create({ data: body });
    return productionEntry;
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
export const updateProductionEntry = async (
  params: updateProductionEntryParamsDTO,
  body: updateProductionEntryBodyDTO,
): Promise<ProductionEntry> => {
  try {
    const productionEntry = await prisma.productionEntry.update({
      where: { id: params.id },
      data: body,
    });
    return productionEntry;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionEntry not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No productionDay/variant exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteProductionEntry = async (
  params: deleteProductionEntryParamsDTO,
): Promise<ProductionEntry> => {
  try {
    const productionEntry = await prisma.productionEntry.delete({
      where: { id: params.id },
    });
    return productionEntry;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("ProductionEntry not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
