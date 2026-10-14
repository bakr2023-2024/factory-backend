import { Request, Response } from "express";
import {} from "./attendance.service";
import {
  createAttendanceBodyDTO,
  deleteAttendanceParamsDTO,
  getAttendanceParamsDTO,
  paginateAttendancesDTO,
  updateAttendanceBodyDTO,
  updateAttendanceParamsDTO,
} from "./attendance.validation";
import * as attendanceService from "./attendance.service";

export const getAttendances = async (req: Request, res: Response) => {
  const dto: paginateAttendancesDTO = req.query as unknown as paginateAttendancesDTO;
  const result = await attendanceService.getAttendances(dto);
  return res.json(result);
};
export const getAttendance = async (req: Request, res: Response) => {
  const dto = req.params as unknown as getAttendanceParamsDTO;
  const data = await attendanceService.getAttendance(dto);
  return res.json({ data });
};
export const createAttendance = async (req: Request, res: Response) => {
  const dto = req.body as createAttendanceBodyDTO;
  const data = await attendanceService.createAttendance(dto);
  return res.status(201).json({ data });
};
export const updateAttendance = async (req: Request, res: Response) => {
  const params = req.params as unknown as updateAttendanceParamsDTO;
  const body = req.body as updateAttendanceBodyDTO;
  const data = await attendanceService.updateAttendance(params, body);
  return res.json({ data });
};
export const deleteAttendance = async (req: Request, res: Response) => {
  const dto = req.params as unknown as deleteAttendanceParamsDTO;
  const data = await attendanceService.deleteAttendance(dto);
  return res.json({ data });
};

