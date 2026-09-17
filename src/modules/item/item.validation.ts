import z from "zod";
import { fields, paginateDTO } from "../../utils/generalFields";
export enum ItemType {
  Product = "PRODUCT",
  Material = "MATERIAL",
}

export const paginateItems = {
  query: fields.paginate,
};
export const getItem = {
  params: z.strictObject({
    id: fields.id,
  }),
};
export const createItem = {
  body: z.strictObject({
    name: fields.name,
    type: z.enum(Object.values(ItemType)),
  }),
};
export const updateItem = {
  params: z.strictObject({
    id: fields.id,
  }),
  body: z.strictObject({
    name: fields.name.optional(),
    type: z.enum(Object.values(ItemType)).optional(),
  }),
};
export const deleteItem = {
  params: z.strictObject({
    id: fields.id,
  }),
};

export type paginateItemsDTO = paginateDTO;
export type getItemParamsDTO = z.infer<typeof getItem.params>;
export type createItemBodyDTO = z.infer<typeof createItem.body>;
export type updateItemParamsDTO = z.infer<typeof updateItem.params>;
export type updateItemBodyDTO = z.infer<typeof updateItem.body>;
export type deleteItemParamsDTO = z.infer<typeof deleteItem.params>;
