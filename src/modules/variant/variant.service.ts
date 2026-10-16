import { Variant, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { paginated } from "../../utils/generalFields";
import { PaginationType } from "../../utils/types/types";
import { buildQuery } from "../../utils/utils";
import {
  createVariantBodyDTO,
  deleteVariantParamsDTO,
  getVariantParamsDTO,
  paginateVariantsDTO,
  updateVariantBodyDTO,
  updateVariantParamsDTO,
  variantRules,
} from "./variant.validation";

export const getVariants = async (
  pagination: paginateVariantsDTO,
): Promise<PaginationType<Variant[]>> => {
  const query = buildQuery(variantRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.variant.findMany(query),
    prisma.variant.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getVariant = async (
  params: getVariantParamsDTO,
): Promise<Variant> => {
  const variant = await prisma.variant.findUnique({ where: { id: params.id } });
  if (!variant) throw new NotFoundException("Variant not found");
  return variant;
};
export const createVariant = async (
  body: createVariantBodyDTO,
): Promise<Variant> => {
  try {
    const variant = await prisma.variant.create({ data: body });
    return variant;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No item exists with this ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateVariant = async (
  params: updateVariantParamsDTO,
  body: updateVariantBodyDTO,
): Promise<Variant> => {
  try {
    const variant = await prisma.variant.update({
      where: { id: params.id },
      data: body,
    });
    return variant;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Variant not found");
      else if (err.code === "P2003")
        throw new ConflictException("No item exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteVariant = async (
  params: deleteVariantParamsDTO,
): Promise<Variant> => {
  try {
    const variant = await prisma.variant.delete({ where: { id: params.id } });
    return variant;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Variant not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
