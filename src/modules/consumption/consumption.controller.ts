import { Request, Response } from "express";
import {} from "./consumption.service";
import {
  createConsumptionBodyDTO,
  deleteConsumptionParamsDTO,
  getConsumptionParamsDTO,
  paginateConsumptionsDTO,
  updateConsumptionBodyDTO,
  updateConsumptionParamsDTO,
} from "./consumption.validation";
import * as consumptionService from "./consumption.service";

export const getConsumptions = async (req: Request, res: Response) => {
  const dto: paginateConsumptionsDTO = req.query as unknown as paginateConsumptionsDTO;
  const result = await consumptionService.getConsumptions(dto);
  return res.json(result);
};
export const getConsumption = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getConsumptionParamsDTO;
  const data = await consumptionService.getConsumption(dto);
  return res.json({ data });
};
export const createConsumption = async (req: Request, res: Response) => {
  const dto = req.body as createConsumptionBodyDTO;
  const data = await consumptionService.createConsumption(dto);
  return res.status(201).json({ data });
};
export const updateConsumption = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateConsumptionParamsDTO;
  const body = req.body as updateConsumptionBodyDTO;
  const data = await consumptionService.updateConsumption(params, body);
  return res.json({ data });
};
export const deleteConsumption = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteConsumptionParamsDTO;
  const data = await consumptionService.deleteConsumption(dto);
  return res.json({ data });
};

