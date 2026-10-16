import { Attendance, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  HttpException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery, throwIfPaidRate } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  attendanceRules,
  createAttendanceBodyDTO,
  deleteAttendanceParamsDTO,
  getAttendanceParamsDTO,
  paginateAttendancesDTO,
  updateAttendanceBodyDTO,
  updateAttendanceParamsDTO,
} from "./attendance.validation";
import { paginated } from "../../utils/generalFields";

export const getAttendances = async (
  pagination: paginateAttendancesDTO,
): Promise<PaginationType<Attendance[]>> => {
  const query = buildQuery(attendanceRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.attendance.findMany(query),
    prisma.attendance.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
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
    return await prisma.$transaction(async (tx) => {
      await throwIfPaidRate(tx, body.rateId);
      const attendance = await tx.attendance.create({ data: body });
      return attendance;
    });

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No rate/productionDay exists with that ID",
        );
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const updateAttendance = async (
  params: updateAttendanceParamsDTO,
  body: updateAttendanceBodyDTO,
): Promise<Attendance> => {
  try {
        return await prisma.$transaction(async (tx) => {
          const attendance = await tx.attendance.findUniqueOrThrow({
            where: { id: params.id },
          });
          await throwIfPaidRate(tx, attendance.rateId, body.rateId);
          return await tx.attendance.update({
            where: { id: params.id },
            data: body,
          });
        });

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Attendance not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No rate/productionDay exists with that ID",
        );
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteAttendance = async (
  params: deleteAttendanceParamsDTO,
): Promise<Attendance> => {
  try {
          return await prisma.$transaction(async (tx) => {
            const attendance = await tx.attendance.findUniqueOrThrow({
              where: { id: params.id },
            });
            await throwIfPaidRate(tx, attendance.rateId);
            return await tx.attendance.delete({
              where: { id: params.id },
            });
          });

  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("Attendance not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    } else if (err instanceof HttpException) throw err;
    throw new InternalServerException((err as Error).message);
  }
};
