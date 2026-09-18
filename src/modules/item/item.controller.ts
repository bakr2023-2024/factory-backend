import { Request, Response } from "express";
import {} from "./item.service";
import {
  createItemBodyDTO,
  deleteItemParamsDTO,
  getItemParamsDTO,
  paginateItemsDTO,
  updateItemBodyDTO,
  updateItemParamsDTO,
} from "./item.validation";
import * as itemService from "./item.service";

export const getItems = async (req: Request, res: Response) => {
  const dto: paginateItemsDTO = req.query as unknown as paginateItemsDTO;
  const result = await itemService.getItems(dto);
  return res.json(result);
};
export const getItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getItemParamsDTO;
  const data = await itemService.getItem(dto);
  return res.json({ data });
};
export const createItem = async (req: Request, res: Response) => {
  const dto = req.body as createItemBodyDTO;
  const data = await itemService.createItem(dto);
  return res.status(201).json({ data });
};
export const updateItem = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateItemParamsDTO;
  const body = req.body as updateItemBodyDTO;
  const data = await itemService.updateItem(params, body);
  return res.json({ data });
};
export const deleteItem = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteItemParamsDTO;
  const data = await itemService.deleteItem(dto);
  return res.json({ data });
};
