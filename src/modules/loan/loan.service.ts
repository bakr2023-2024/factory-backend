import { Loan, Prisma } from "../../db/generated/prisma/client";
import {
  LoanFindManyArgs,
  LoanWhereInput,
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
  createLoanBodyDTO,
  deleteLoanParamsDTO,
  getLoanParamsDTO,
  paginateLoansDTO,
  updateLoanBodyDTO,
  updateLoanParamsDTO,
} from "./loan.validation";

export const getLoans = async (
  pagination: paginateLoansDTO,
): Promise<PaginationType<Loan[]>> => {
  const { page, size } = pagination;
  const query: LoanFindManyArgs = {};
  const where: LoanWhereInput = {};
  const orderBy: Prisma.LoanOrderByWithRelationInput = {};
  const laborer: Prisma.LaborerWhereInput = {};
  // inject fields into query
  if (pagination.laborerId) where.laborerId = pagination.laborerId;
  if (pagination.laborerName)
    laborer.name = { contains: pagination.laborerName, mode: "insensitive" };
  if (pagination.laborerNumber)
    laborer.number = {
      contains: pagination.laborerNumber,
      mode: "insensitive",
    };
  if (pagination.seasonId) where.seasonId = pagination.seasonId;
  if (pagination.loanAmount) where.loanAmount = pagination.loanAmount;
  if (pagination.loanedAt) where.loanedAt = { gte: pagination.loanedAt };
  if (pagination.paymentId) where.paymentId = pagination.paymentId;
  if (Object.keys(laborer).length) where.laborer = laborer;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.loan.findMany(query);
  const totalCount = await prisma.loan.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
    const loan = await prisma.loan.create({ data: body });
    return loan;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No laborer/season exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateLoan = async (
  params: updateLoanParamsDTO,
  body: updateLoanBodyDTO,
): Promise<Loan> => {
  try {
    const loan = await prisma.loan.update({
      where: { id: params.id },
      data: body,
    });
    return loan;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Loan not found");
      else if (err.code === "P2003")
        throw new ConflictException("No laborer/season exists with that ID");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteLoan = async (
  params: deleteLoanParamsDTO,
): Promise<Loan> => {
  try {
    const loan = await prisma.loan.delete({
      where: { id: params.id },
    });
    return loan;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Loan not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
