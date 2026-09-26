import { Request, Response } from "express";
import {} from "./season.service";
import {
  createSeasonBodyDTO,
  deleteSeasonParamsDTO,
  getSeasonParamsDTO,
  paginateSeasonsDTO,
  updateSeasonBodyDTO,
  updateSeasonParamsDTO,
} from "./season.validation";
import * as seasonService from "./season.service";

export const getSeasons = async (req: Request, res: Response) => {
  const dto: paginateSeasonsDTO = req.query as unknown as paginateSeasonsDTO;
  const result = await seasonService.getSeasons(dto);
  return res.json(result);
};
export const getSeason = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getSeasonParamsDTO;
  const data = await seasonService.getSeason(dto);
  return res.json({ data });
};
export const createSeason = async (req: Request, res: Response) => {
  const dto = req.body as createSeasonBodyDTO;
  const data = await seasonService.createSeason(dto);
  return res.status(201).json({ data });
};
export const updateSeason = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateSeasonParamsDTO;
  const body = req.body as updateSeasonBodyDTO;
  const data = await seasonService.updateSeason(params, body);
  return res.json({ data });
};
export const deleteSeason = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteSeasonParamsDTO;
  const data = await seasonService.deleteSeason(dto);
  return res.json({ data });
};

