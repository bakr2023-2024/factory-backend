import { Request, Response } from "express";
import {} from "./expense.service";
import {
  createExpenseBodyDTO,
  deleteExpenseParamsDTO,
  getExpenseParamsDTO,
  paginateExpensesDTO,
  updateExpenseBodyDTO,
  updateExpenseParamsDTO,
} from "./expense.validation";
import * as expenseService from "./expense.service";

export const getExpenses = async (req: Request, res: Response) => {
  const dto: paginateExpensesDTO = req.query as unknown as paginateExpensesDTO;
  const result = await expenseService.getExpenses(dto);
  return res.json(result);
};
export const getExpense = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getExpenseParamsDTO;
  const data = await expenseService.getExpense(dto);
  return res.json({ data });
};
export const createExpense = async (req: Request, res: Response) => {
  const dto = req.body as createExpenseBodyDTO;
  const data = await expenseService.createExpense(dto);
  return res.status(201).json({ data });
};
export const updateExpense = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateExpenseParamsDTO;
  const body = req.body as updateExpenseBodyDTO;
  const data = await expenseService.updateExpense(params, body);
  return res.json({ data });
};
export const deleteExpense = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteExpenseParamsDTO;
  const data = await expenseService.deleteExpense(dto);
  return res.json({ data });
};

