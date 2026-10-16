import { LoanPayment, Prisma } from "../../db/generated/prisma/client";
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
  createLoanPaymentBodyDTO,
  deleteLoanPaymentParamsDTO,
  getLoanPaymentParamsDTO,
  loanPaymentRules,
  paginateLoanPaymentsDTO,
  updateLoanPaymentBodyDTO,
  updateLoanPaymentParamsDTO,
} from "./loanPayment.validation";
import { paginated } from "../../utils/generalFields";

export const getLoanPayments = async (
  pagination: paginateLoanPaymentsDTO,
): Promise<PaginationType<LoanPayment[]>> => {
  const query = buildQuery(loanPaymentRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.loanPayment.findMany(query),
    prisma.loanPayment.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getLoanPayment = async (
  params: getLoanPaymentParamsDTO,
): Promise<LoanPayment> => {
  const loanPayment = await prisma.loanPayment.findUnique({
    where: { id: params.id },
  });
  if (!loanPayment) throw new NotFoundException("LoanPayment not found");
  return loanPayment;
};
export const createLoanPayment = async (
  body: createLoanPaymentBodyDTO,
): Promise<LoanPayment> => {
  try {
    return await prisma.$transaction(async (tx) => {
      await throwIfPaidRate(tx, body.rateId);
      return await tx.loanPayment.create({ data: body });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException("No rate exists with that ID");
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const updateLoanPayment = async (
  params: updateLoanPaymentParamsDTO,
  body: updateLoanPaymentBodyDTO,
): Promise<LoanPayment> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const loanPayment = await tx.loanPayment.findUniqueOrThrow({
        where: { id: params.id },
      });
      await throwIfPaidRate(tx, loanPayment.rateId, body.rateId);
      return await tx.loanPayment.update({
        where: { id: params.id },
        data: body,
      });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("LoanPayment not found");
      else if (err.code === "P2003")
        throw new ConflictException("No rate exists with that ID");
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteLoanPayment = async (
  params: deleteLoanPaymentParamsDTO,
): Promise<LoanPayment> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const loanPayment = await tx.loanPayment.findUniqueOrThrow({
        where: { id: params.id },
      });
      await throwIfPaidRate(tx, loanPayment.rateId);
      return await tx.loanPayment.delete({ where: { id: params.id } });
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("LoanPayment not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
