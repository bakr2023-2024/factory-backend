import { LoanPayment, Prisma } from "../../db/generated/prisma/client";
import {
  LoanPaymentFindManyArgs,
  LoanPaymentWhereInput,
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
  createLoanPaymentBodyDTO,
  deleteLoanPaymentParamsDTO,
  getLoanPaymentParamsDTO,
  paginateLoanPaymentsDTO,
  updateLoanPaymentBodyDTO,
  updateLoanPaymentParamsDTO,
} from "./loanPayment.validation";

export const getLoanPayments = async (
  pagination: paginateLoanPaymentsDTO,
): Promise<PaginationType<LoanPayment[]>> => {
  const { page, size } = pagination;
  const query: LoanPaymentFindManyArgs = {};
  const where: LoanPaymentWhereInput = {};
  const orderBy: Prisma.LoanPaymentOrderByWithRelationInput = {};
  const laborer: Prisma.LaborerWhereInput = {};
  // inject fields into query
  if (pagination.laborerId) laborer.id = pagination.laborerId;
  if (pagination.laborerName)
    laborer.name = { contains: pagination.laborerName, mode: "insensitive" };
  if (pagination.laborerNumber)
    laborer.number = {
      contains: pagination.laborerNumber,
      mode: "insensitive",
    };
  if (pagination.loanId) where.loanId = pagination.loanId;
  if (pagination.amount) where.amount = pagination.amount;
  if (pagination.repaidAt) where.repaidAt = { gte: pagination.repaidAt };
  if (pagination.paymentId) where.paymentId = pagination.paymentId;
  if (Object.keys(laborer).length) where.loan = { laborer };

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.loanPayment.findMany(query);
  const totalCount = await prisma.loanPayment.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
    const loanPayment = await prisma.loanPayment.create({ data: body });
    return loanPayment;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No loan exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateLoanPayment = async (
  params: updateLoanPaymentParamsDTO,
  body: updateLoanPaymentBodyDTO,
): Promise<LoanPayment> => {
  try {
    const loanPayment = await prisma.loanPayment.update({
      where: { id: params.id },
      data: body,
    });
    return loanPayment;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("LoanPayment not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No loan exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteLoanPayment = async (
  params: deleteLoanPaymentParamsDTO,
): Promise<LoanPayment> => {
  try {
    const loanPayment = await prisma.loanPayment.delete({
      where: { id: params.id },
    });
    return loanPayment;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("LoanPayment not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
