import { Request, Response } from "express";
import {} from "./loanPayment.service";
import {
  createLoanPaymentBodyDTO,
  deleteLoanPaymentParamsDTO,
  getLoanPaymentParamsDTO,
  paginateLoanPaymentsDTO,
  updateLoanPaymentBodyDTO,
  updateLoanPaymentParamsDTO,
} from "./loanPayment.validation";
import * as loanPaymentService from "./loanPayment.service";

export const getLoanPayments = async (req: Request, res: Response) => {
  const dto: paginateLoanPaymentsDTO = req.query as unknown as paginateLoanPaymentsDTO;
  const result = await loanPaymentService.getLoanPayments(dto);
  return res.json(result);
};
export const getLoanPayment = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getLoanPaymentParamsDTO;
  const data = await loanPaymentService.getLoanPayment(dto);
  return res.json({ data });
};
export const createLoanPayment = async (req: Request, res: Response) => {
  const dto = req.body as createLoanPaymentBodyDTO;
  const data = await loanPaymentService.createLoanPayment(dto);
  return res.status(201).json({ data });
};
export const updateLoanPayment = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateLoanPaymentParamsDTO;
  const body = req.body as updateLoanPaymentBodyDTO;
  const data = await loanPaymentService.updateLoanPayment(params, body);
  return res.json({ data });
};
export const deleteLoanPayment = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteLoanPaymentParamsDTO;
  const data = await loanPaymentService.deleteLoanPayment(dto);
  return res.json({ data });
};

