import { Request, Response } from "express";
import {} from "./loan.service";
import {
  createLoanBodyDTO,
  deleteLoanParamsDTO,
  getLoanParamsDTO,
  paginateLoansDTO,
  updateLoanBodyDTO,
  updateLoanParamsDTO,
} from "./loan.validation";
import * as loanService from "./loan.service";

export const getLoans = async (req: Request, res: Response) => {
  const dto: paginateLoansDTO = req.query as unknown as paginateLoansDTO;
  const result = await loanService.getLoans(dto);
  return res.json(result);
};
export const getLoan = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getLoanParamsDTO;
  const data = await loanService.getLoan(dto);
  return res.json({ data });
};
export const createLoan = async (req: Request, res: Response) => {
  const dto = req.body as createLoanBodyDTO;
  const data = await loanService.createLoan(dto);
  return res.status(201).json({ data });
};
export const updateLoan = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateLoanParamsDTO;
  const body = req.body as updateLoanBodyDTO;
  const data = await loanService.updateLoan(params, body);
  return res.json({ data });
};
export const deleteLoan = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteLoanParamsDTO;
  const data = await loanService.deleteLoan(dto);
  return res.json({ data });
};

