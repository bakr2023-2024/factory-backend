import z from "zod";
import { fields } from "../../utils/generalFields";
import { SeasonKind } from "../../db/generated/prisma/enums";
import { FilterRule } from "../../utils/utils";

export const paginateSeasons = {
  query: fields.paginate("Season").extend({
    name: fields.name.optional(),
    startDate: fields.date.optional(),
    endDate: fields.date.optional(),
    kind: z.enum(Object.values(SeasonKind)).optional(),
  }),
};
export const seasonRules: FilterRule<paginateSeasonsDTO>[] = [
  { path: ["name"], param: "name", op: "contains" },
  { path: ["kind"], param: "kind" },
  { path: ["startDate"], param: "startDate", op: "gte" },
  { path: ["endDate"], param: "endDate", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getSeason = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createSeason = {
  body: z.strictObject({
    startDate: fields.date.optional(),
    endDate: fields.date.optional(),
    name: fields.name.optional(),
    notes: z.string().optional(),
  }),
};
export const updateSeason = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    startDate: fields.date.optional(),
    endDate: fields.date.optional(),
    name: fields.name.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSeason = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateSeasonsDTO = z.infer<typeof paginateSeasons.query>;
export type getSeasonParamsDTO = z.infer<typeof getSeason.params>;
export type createSeasonBodyDTO = z.infer<typeof createSeason.body>;
export type updateSeasonParamsDTO = z.infer<typeof updateSeason.params>;
export type updateSeasonBodyDTO = z.infer<typeof updateSeason.body>;
export type deleteSeasonParamsDTO = z.infer<typeof deleteSeason.params>;
