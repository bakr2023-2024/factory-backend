import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateWeeks = {
  query: fields.paginate("Week").extend({
    seasonName: fields.name.optional(),
    seasonId: fields.integerParam.optional(),
    startDate: fields.date.optional(),
    endDate: fields.date.optional(),
  }),
};
export const weekRules: FilterRule<paginateWeeksDTO>[] = [
  { path: ["seasonId"], param: "seasonId" },
  { path: ["season", "name"], param: "seasonName", op: "contains" },
  { path: ["startDate"], param: "startDate", op: "gte" },
  { path: ["endDate"], param: "endDate", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getWeek = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createWeek = {
  body: z.strictObject({
    seasonId: fields.integerBody,
    startDate: fields.date.optional(),
    endDate: fields.date.optional(),
    notes: z.string().optional(),
  }),
};
export const updateWeek = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    seasonId: fields.integerBody.optional(),
    startDate: fields.date.optional(),
    endDate: fields.date.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteWeek = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateWeeksDTO = z.infer<typeof paginateWeeks.query>;
export type getWeekParamsDTO = z.infer<typeof getWeek.params>;
export type createWeekBodyDTO = z.infer<typeof createWeek.body>;
export type updateWeekParamsDTO = z.infer<typeof updateWeek.params>;
export type updateWeekBodyDTO = z.infer<typeof updateWeek.body>;
export type deleteWeekParamsDTO = z.infer<typeof deleteWeek.params>;
