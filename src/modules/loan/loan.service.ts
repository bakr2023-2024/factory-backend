import { Loan, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  HttpException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery, throwIfPaidRate } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createLoanBodyDTO,
  deleteLoanParamsDTO,
  getLoanParamsDTO,
  loanRules,
  paginateLoansDTO,
  updateLoanBodyDTO,
  updateLoanParamsDTO,
} from "./loan.validation";
import { paginated } from "../../utils/generalFields";

export const getLoans = async (
  pagination: paginateLoansDTO,
): Promise<PaginationType<Loan[]>> => {
  const query = buildQuery(loanRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.loan.findMany(query),
    prisma.loan.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getLoan = async (params: getLoanParamsDTO): Promise<Loan> => {
  const loan = await prisma.loan.findUnique({
    where: { id: params.id },
  });
  if (!loan) throw new NotFoundException("Loan not found");
  return loan;
};
export const createLoan = async (body: createLoanBodyDTO): Promise<Loan> => {
  try {
    return await prisma.$transaction(async (tx) => {
      await throwIfPaidRate(tx, body.rateId);
      return await tx.loan.create({ data: body });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No rate/productionDay exists with that ID");
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const updateLoan = async (
  params: updateLoanParamsDTO,
  body: updateLoanBodyDTO,
): Promise<Loan> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUniqueOrThrow({
        where: { id: params.id },
      });
      await throwIfPaidRate(tx, loan.rateId, body.rateId);
      return await tx.loan.update({ where: { id: params.id }, data: body });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Loan not found");
      else if (err.code === "P2003")
        throw new ConflictException("No rate/productionDay exists with that ID");
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteLoan = async (
  params: deleteLoanParamsDTO,
): Promise<Loan> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUniqueOrThrow({
        where: { id: params.id },
      });
      await throwIfPaidRate(tx, loan.rateId);
      return await tx.loan.delete({ where: { id: params.id } });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Loan not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
