import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateVariants = {
  query: fields.paginate("Variant").extend({
    itemId: fields.idParam.optional(),
    itemName: fields.name.optional(),
  }),
};
export const getVariant = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createVariant = {
  body: z.strictObject({
    itemId: fields.idBody,
    unitWeight: fields.unitWeight,
    notes: z.string().optional(),
  }),
};
export const updateVariant = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    itemId: fields.idBody.optional(),
    unitWeight: fields.unitWeight.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteVariant = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateVariantsDTO = z.infer<typeof paginateVariants.query>;
export type getVariantParamsDTO = z.infer<typeof getVariant.params>;
export type createVariantBodyDTO = z.infer<typeof createVariant.body>;
export type updateVariantParamsDTO = z.infer<typeof updateVariant.params>;
export type updateVariantBodyDTO = z.infer<typeof updateVariant.body>;
export type deleteVariantParamsDTO = z.infer<typeof deleteVariant.params>;
