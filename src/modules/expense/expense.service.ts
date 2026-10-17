import { Expense, Prisma } from "../../db/generated/prisma/client";
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
  createExpenseBodyDTO,
  deleteExpenseParamsDTO,
  getExpenseParamsDTO,
  paginateExpensesDTO,
  expenseRules,
  updateExpenseBodyDTO,
  updateExpenseParamsDTO,
} from "./expense.validation";

export const getExpenses = async (
  pagination: paginateExpensesDTO,
): Promise<PaginationType<Expense[]>> => {
  const query = buildQuery(expenseRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.expense.findMany(query),
    prisma.expense.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getExpense = async (
  params: getExpenseParamsDTO,
): Promise<Expense> => {
  const expense = await prisma.expense.findUnique({ where: { id: params.id } });
  if (!expense) throw new NotFoundException("Expense not found");
  return expense;
};
export const createExpense = async (
  body: createExpenseBodyDTO,
): Promise<Expense> => {
  try {
    const expense = await prisma.expense.create({ data: body });
    return expense;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No productionDay exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateExpense = async (
  params: updateExpenseParamsDTO,
  body: updateExpenseBodyDTO,
): Promise<Expense> => {
  try {
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: body,
    });
    return expense;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Expense not found");
      else if (err.code === "P2003")
        throw new ConflictException("No productionDay exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteExpense = async (
  params: deleteExpenseParamsDTO,
): Promise<Expense> => {
  try {
    const expense = await prisma.expense.delete({ where: { id: params.id } });
    return expense;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Expense not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
