import z from "zod";
import { fields } from "../../utils/generalFields";
import { ItemType } from "../../db/generated/prisma/enums";

export const paginateItems = {
  query: fields.paginate.extend({
    name: fields.name.optional(),
  }),
};
export const getItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createItem = {
  body: z.strictObject({
    name: fields.name,
    type: z.enum(Object.values(ItemType)),
    notes: z.string().optional(),
  }),
};
export const updateItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    name: fields.name.optional(),
    type: z.enum(Object.values(ItemType)).optional(),
    notes: z.string().optional(),
  }),
};
export const deleteItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateItemsDTO = z.infer<typeof paginateItems.query>;
export type getItemParamsDTO = z.infer<typeof getItem.params>;
export type createItemBodyDTO = z.infer<typeof createItem.body>;
export type updateItemParamsDTO = z.infer<typeof updateItem.params>;
export type updateItemBodyDTO = z.infer<typeof updateItem.body>;
export type deleteItemParamsDTO = z.infer<typeof deleteItem.params>;
