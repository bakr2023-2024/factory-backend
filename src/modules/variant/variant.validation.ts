import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateVariants = {
  query: fields.paginate("Variant").extend({
    itemId: fields.integerParam.optional(),
    itemName: fields.name.optional(),
    unitWeight: fields.doubleParam.optional(),
  }),
};
export const variantRules: FilterRule<paginateVariantsDTO>[] = [
  { path: ["itemId"], param: "itemId" },
  { path: ["item", "name"], param: "itemName", op: "contains" },
  { path: ["unitWeight"], param: "unitWeight" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
export const getVariant = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createVariant = {
  body: z.strictObject({
    itemId: fields.integerBody,
    unitWeight: fields.doubleBody.default(1),
    notes: z.string().optional(),
  }),
};
export const updateVariant = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    itemId: fields.integerBody.optional(),
    unitWeight: fields.doubleBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteVariant = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateVariantsDTO = z.infer<typeof paginateVariants.query>;
export type getVariantParamsDTO = z.infer<typeof getVariant.params>;
export type createVariantBodyDTO = z.infer<typeof createVariant.body>;
export type updateVariantParamsDTO = z.infer<typeof updateVariant.params>;
export type updateVariantBodyDTO = z.infer<typeof updateVariant.body>;
export type deleteVariantParamsDTO = z.infer<typeof deleteVariant.params>;

