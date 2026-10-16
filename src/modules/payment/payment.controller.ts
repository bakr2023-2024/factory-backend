import { Request, Response } from "express";
import {} from "./payment.service";
import {
  createPaymentBodyDTO,
  deletePaymentParamsDTO,
  getPaymentParamsDTO,
  getPreviewParamsDTO,
  paginatePaymentsDTO,
} from "./payment.validation";
import * as paymentService from "./payment.service";

export const getPayments = async (req: Request, res: Response) => {
  const dto: paginatePaymentsDTO = req.query as unknown as paginatePaymentsDTO;
  const result = await paymentService.getPayments(dto);
  return res.json(result);
};
export const getPayment = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getPaymentParamsDTO;
  const data = await paymentService.getPayment(dto);
  return res.json({ data });
};
export const getPreview = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getPreviewParamsDTO;
  const data = await paymentService.getPreview(dto);
  return res.json({ data });
};
export const createPayment = async (req: Request, res: Response) => {
  const dto = req.body as createPaymentBodyDTO;
  const data = await paymentService.createPayment(dto);
  return res.status(201).json({ data });
};
export const deletePayment = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deletePaymentParamsDTO;
  const data = await paymentService.deletePayment(dto);
  return res.json({ data });
};
