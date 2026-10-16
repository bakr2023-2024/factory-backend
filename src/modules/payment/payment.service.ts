import { Payment, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType, PaymentPreview } from "../../utils/types/types";
import {
  createPaymentBodyDTO,
  deletePaymentParamsDTO,
  getPaymentParamsDTO,
  getPreviewParamsDTO,
  paginatePaymentsDTO,
  paymentRules,
} from "./payment.validation";
import { paginated } from "../../utils/generalFields";

export const getPayments = async (
  pagination: paginatePaymentsDTO,
): Promise<PaginationType<Payment[]>> => {
  const query = buildQuery(paymentRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.payment.findMany(query),
    prisma.payment.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getPayment = async (
  params: getPaymentParamsDTO,
): Promise<Payment> => {
  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
  });
  if (!payment) throw new NotFoundException("Payment not found");
  return payment;
};
export const getPreview = async (
  params: getPreviewParamsDTO,
): Promise<PaymentPreview> => {
  const rate = await prisma.rate.findUnique({
    where: { id: params.rateId },
    include: {
      attendances: true,
      loans: true,
      loanPayments: true,
      payment: true,
    },
  });
  if (!rate) throw new NotFoundException("Rate not found");

  const days = rate.attendances.reduce(
    (acc, a) => acc + a.factor.toNumber(),
    0,
  );
  const dailySalary = rate.dailySalary.toNumber();
  const gross = days * dailySalary;
  const loans = rate.loans.reduce((acc, l) => acc + l.amount.toNumber(), 0);
  const loanPayments = rate.loanPayments.reduce(
    (acc, lp) => acc + lp.amount.toNumber(),
    0,
  );

  return {
    rateId: rate.id,
    days,
    dailySalary,
    gross,
    loans,
    loanPayments,
    net: gross - loans + loanPayments,
    paid: rate.payment !== null,
    occurredAt: rate.payment?.occurredAt ?? null,
  };
};
export const createPayment = async (
  body: createPaymentBodyDTO,
): Promise<Payment> => {
  try {
    const payment = await prisma.payment.create({ data: body });
    return payment;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No rate exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deletePayment = async (
  params: deletePaymentParamsDTO,
): Promise<Payment> => {
  try {
    const payment = await prisma.payment.delete({
      where: { id: params.id },
    });
    return payment;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Payment not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
