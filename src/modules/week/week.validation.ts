import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateWeeks = {
  query: fields.paginate("Week").extend({
    seasonName: fields.name.optional(),
    seasonId: fields.idParam.optional(),
    startedFrom: fields.dateTime.optional(),
    startedTo: fields.dateTime.optional(),
    endedFrom: fields.dateTime.optional(),
    endedTo: fields.dateTime.optional(),
  }),
};
export const getWeek = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createWeek = {
  body: z.strictObject({
    seasonId: fields.idBody,
    startDate: fields.dateTime.optional(),
    endDate: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const updateWeek = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    seasonId: fields.idBody.optional(),
    startDate: fields.dateTime.optional(),
    endDate: fields.dateTime.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteWeek = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateWeeksDTO = z.infer<typeof paginateWeeks.query>;
export type getWeekParamsDTO = z.infer<typeof getWeek.params>;
export type createWeekBodyDTO = z.infer<typeof createWeek.body>;
export type updateWeekParamsDTO = z.infer<typeof updateWeek.params>;
export type updateWeekBodyDTO = z.infer<typeof updateWeek.body>;
export type deleteWeekParamsDTO = z.infer<typeof deleteWeek.params>;
