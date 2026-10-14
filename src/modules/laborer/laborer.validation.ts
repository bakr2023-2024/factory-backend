import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateLaborers = {
  query: fields.paginate("Laborer").extend({
    name: fields.name.optional(),
    number: fields.number.optional(),
  }),
};
export const getLaborer = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};
export const createLaborer = {
  body: z.strictObject({
    name: fields.name,
    number: fields.number.optional(),
    notes: z.string().optional(),
  }),
};
export const updateLaborer = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
  body: z.strictObject({
    name: fields.name.optional(),
    number: fields.number.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteLaborer = {
  params: z.strictObject({
    id: fields.integerParam(),
  }),
};

export type paginateLaborersDTO = z.infer<
  typeof paginateLaborers.query
>;
export type getLaborerParamsDTO = z.infer<typeof getLaborer.params>;
export type createLaborerBodyDTO = z.infer<typeof createLaborer.body>;
export type updateLaborerParamsDTO = z.infer<
  typeof updateLaborer.params
>;
export type updateLaborerBodyDTO = z.infer<typeof updateLaborer.body>;
export type deleteLaborerParamsDTO = z.infer<
  typeof deleteLaborer.params
>;

