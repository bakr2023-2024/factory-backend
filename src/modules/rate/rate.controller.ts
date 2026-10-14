import { Request, Response } from "express";
import {} from "./rate.service";
import {
  createRateBodyDTO,
  deleteRateParamsDTO,
  getRateParamsDTO,
  paginateRatesDTO,
  updateRateBodyDTO,
  updateRateParamsDTO,
} from "./rate.validation";
import * as rateService from "./rate.service";

export const getRates = async (req: Request, res: Response) => {
  const dto: paginateRatesDTO = req.query as unknown as paginateRatesDTO;
  const result = await rateService.getRates(dto);
  return res.json(result);
};
export const getRate = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getRateParamsDTO;
  const data = await rateService.getRate(dto);
  return res.json({ data });
};
export const createRate = async (req: Request, res: Response) => {
  const dto = req.body as createRateBodyDTO;
  const data = await rateService.createRate(dto);
  return res.status(201).json({ data });
};
export const updateRate = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateRateParamsDTO;
  const body = req.body as updateRateBodyDTO;
  const data = await rateService.updateRate(params, body);
  return res.json({ data });
};
export const deleteRate = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteRateParamsDTO;
  const data = await rateService.deleteRate(dto);
  return res.json({ data });
};

