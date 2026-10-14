import { Attendance, Prisma } from "../../db/generated/prisma/client";
import {
  AttendanceFindManyArgs,
  AttendanceWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createAttendanceBodyDTO,
  deleteAttendanceParamsDTO,
  getAttendanceParamsDTO,
  paginateAttendancesDTO,
  updateAttendanceBodyDTO,
  updateAttendanceParamsDTO,
} from "./attendance.validation";

export const getAttendances = async (
  pagination: paginateAttendancesDTO,
): Promise<PaginationType<Attendance[]>> => {
  const { page, size } = pagination;
  const query: AttendanceFindManyArgs = {};
  const where: AttendanceWhereInput = {};
  const orderBy: Prisma.AttendanceOrderByWithRelationInput = {};
  const laborer: Prisma.LaborerWhereInput = {};
  // inject fields into query
  if (pagination.laborerId) where.laborerId = pagination.laborerId;
  if (pagination.productionDayId)
    where.productionDayId = pagination.productionDayId;
  if (pagination.productionDate)
    where.productionDay = { productionDate: pagination.productionDate };
  if (pagination.laborerName)
    laborer.name = { contains: pagination.laborerName, mode: "insensitive" };
  if (pagination.laborerNumber)
    laborer.number = {
      contains: pagination.laborerNumber,
      mode: "insensitive",
    };
  if (pagination.cameAt) where.cameAt = { gte: pagination.cameAt };
  if (pagination.leftAt) where.leftAt = { lte: pagination.leftAt };
  if (pagination.factor) where.factor = pagination.factor;
  if (Object.keys(laborer).length) where.laborer = laborer;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.attendance.findMany(query);
  const totalCount = await prisma.attendance.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getAttendance = async (
  params: getAttendanceParamsDTO,
): Promise<Attendance> => {
  const attendance = await prisma.attendance.findUnique({
    where: { id: params.id },
  });
  if (!attendance) throw new NotFoundException("Attendance not found");
  return attendance;
};
export const createAttendance = async (
  body: createAttendanceBodyDTO,
): Promise<Attendance> => {
  try {
    const attendance = await prisma.attendance.create({ data: body });
    return attendance;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No laborer/productionDay exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateAttendance = async (
  params: updateAttendanceParamsDTO,
  body: updateAttendanceBodyDTO,
): Promise<Attendance> => {
  try {
    const attendance = await prisma.attendance.update({
      where: { id: params.id },
      data: body,
    });
    return attendance;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Attendance not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No laborer/productionDay exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteAttendance = async (
  params: deleteAttendanceParamsDTO,
): Promise<Attendance> => {
  try {
    const attendance = await prisma.attendance.delete({
      where: { id: params.id },
    });
    return attendance;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Attendance not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
