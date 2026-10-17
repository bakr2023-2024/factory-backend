import { Prisma, StockMovementType } from "../db/generated/prisma/client";
import { StockMovementCreateInput } from "../db/generated/prisma/models";
import { ConflictException } from "./exceptions";

type Pagination = {
  page: number;
  size: number;
  order: "asc" | "desc";
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
  sortBy?: string | undefined;
};

export type FilterRuleOptions = "contains" | "lte" | "gte" | "equal";
export type FilterRule<T> = {
  path: string[];
  param: keyof T;
  op?: FilterRuleOptions;
};
const buildOption = (val: unknown, op: FilterRuleOptions = "equal") => {
  if (op == "contains") return { contains: val, mode: "insensitive" };
  else if (op == "gte") return { gte: val };
  else if (op == "lte") return { lte: val };
  else return val;
};
const isObj = (obj: unknown): obj is Record<string, unknown> =>
  obj !== null && typeof obj == "object" && !Array.isArray(obj);
const deepMerge = (obj1: object, obj2: object) => {
  if (!isObj(obj1) || !isObj(obj2)) return obj2;
  for (const key in obj2)
    obj1[key] = deepMerge(obj1[key] as object, obj2[key] as object);
  return obj1;
};
export const buildQuery = <T extends Pagination>(
  rules: FilterRule<T>[],
  pagination: T,
) => {
  const { page, size } = pagination;
  const objects = rules
    .filter((rule) => pagination[rule.param] !== undefined)
    .map((rule) =>
      rule.path.reduceRight(
        (acc, field) => ({ [field]: acc }),
        buildOption(pagination[rule.param], rule.op),
      ),
    ) as object[];

  return {
    where: objects.reduce((acc, obj) => deepMerge(acc, obj), {}),
    skip: (page - 1) * size,
    take: size,
    orderBy: pagination.sortBy
      ? { [pagination.sortBy]: pagination.order }
      : undefined,
  };
};
export const createStockMovement = async (
  tx: Prisma.TransactionClient,
  data: StockMovementCreateInput,
) => {
  await tx.stockMovement.create({ data });
};

export const updateStockMovement = async (
  tx: Prisma.TransactionClient,
  type: StockMovementType,
  typeRef: number,
  quantityChanged: number,
) => {
  await tx.stockMovement.update({
    where: { type_typeRef: { type, typeRef } },
    data: { quantityChanged },
  });
};
export const deleteStockMovement = async (
  tx: Prisma.TransactionClient,
  type: StockMovementType,
  typeRef: number,
) => {
  await tx.stockMovement.delete({
    where: { type_typeRef: { type, typeRef } },
  });
};

export const throwIfPaidRate = async (
  tx: Prisma.TransactionClient,
  currentRateId: number,
  newRateId?: number,
) => {
  if (await tx.payment.findUnique({ where: { rateId: currentRateId } }))
    throw new ConflictException(
      "can't change attendance, loan, loanPayment or payment of a paid rate",
    );
  if (
    newRateId !== undefined &&
    (await tx.payment.findUnique({ where: { rateId: newRateId } }))
  )
    throw new ConflictException(
      "can't relate attendance, loan, loanPayment or payment to a paid rate",
    );
};
