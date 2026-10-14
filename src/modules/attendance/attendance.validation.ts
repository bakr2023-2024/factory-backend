import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateAttendances = {
  query: fields.paginate("Attendance").extend({
    laborerId: fields.integerParam().optional(),
    productionDayId: fields.integerParam().optional(),
    laborerName: fields.name.optional(),
    laborerNumber: fields.number.optional(),
    productionDate: fields.date.optional(),
    cameAt: fields.dateTime.optional(),
    leftAt: fields.dateTime.optional(),
    factor: fields.doubleParam().optional(),
  }),
};
export const getAttendance = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createAttendance = {
  body: z.strictObject({
    laborerId: fields.integerBody(),
    productionDayId: fields.integerBody(),
    cameAt: fields.dateTime.optional(),
    leftAt: fields.dateTime.optional(),
    factor: fields.doubleBody().optional(),
    notes: z.string().optional(),
  }),
};
export const updateAttendance = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    laborerId: fields.integerBody().optional(),
    productionDayId: fields.integerBody().optional(),
    cameAt: fields.dateTime.optional(),
    leftAt: fields.dateTime.optional(),
    factor: fields.doubleBody().optional(),
    notes: z.string().optional(),
  }),
};
export const deleteAttendance = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateAttendancesDTO = z.infer<typeof paginateAttendances.query>;
export type getAttendanceParamsDTO = z.infer<typeof getAttendance.params>;
export type createAttendanceBodyDTO = z.infer<typeof createAttendance.body>;
export type updateAttendanceParamsDTO = z.infer<typeof updateAttendance.params>;
export type updateAttendanceBodyDTO = z.infer<typeof updateAttendance.body>;
export type deleteAttendanceParamsDTO = z.infer<typeof deleteAttendance.params>;
