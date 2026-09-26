import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateSeasons = {
  query: fields.paginate("Season").extend({
    name: fields.name.optional(),
    startedFrom: fields.dateTime.optional(),
    startedTo: fields.dateTime.optional(),
    endedFrom: fields.dateTime.optional(),
    endedTo: fields.dateTime.optional(),
  }),
};
export const getSeason = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createSeason = {
  body: z.strictObject({
    startDate: fields.dateTime.optional(),
    endDate: fields.dateTime.optional(),
    name: fields.name.optional(),
    notes: z.string().optional(),
  }),
};
export const updateSeason = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    startDate: fields.dateTime.optional(),
    endDate: fields.dateTime.optional(),
    name: fields.name.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteSeason = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateSeasonsDTO = z.infer<typeof paginateSeasons.query>;
export type getSeasonParamsDTO = z.infer<typeof getSeason.params>;
export type createSeasonBodyDTO = z.infer<typeof createSeason.body>;
export type updateSeasonParamsDTO = z.infer<typeof updateSeason.params>;
export type updateSeasonBodyDTO = z.infer<typeof updateSeason.body>;
export type deleteSeasonParamsDTO = z.infer<typeof deleteSeason.params>;
