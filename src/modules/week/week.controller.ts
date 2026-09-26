import { Request, Response } from "express";
import {} from "./week.service";
import {
  createWeekBodyDTO,
  deleteWeekParamsDTO,
  getWeekParamsDTO,
  paginateWeeksDTO,
  updateWeekBodyDTO,
  updateWeekParamsDTO,
} from "./week.validation";
import * as weekService from "./week.service";

export const getWeeks = async (req: Request, res: Response) => {
  const dto: paginateWeeksDTO = req.query as unknown as paginateWeeksDTO;
  const result = await weekService.getWeeks(dto);
  return res.json(result);
};
export const getWeek = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getWeekParamsDTO;
  const data = await weekService.getWeek(dto);
  return res.json({ data });
};
export const createWeek = async (req: Request, res: Response) => {
  const dto = req.body as createWeekBodyDTO;
  const data = await weekService.createWeek(dto);
  return res.status(201).json({ data });
};
export const updateWeek = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateWeekParamsDTO;
  const body = req.body as updateWeekBodyDTO;
  const data = await weekService.updateWeek(params, body);
  return res.json({ data });
};
export const deleteWeek = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteWeekParamsDTO;
  const data = await weekService.deleteWeek(dto);
  return res.json({ data });
};

