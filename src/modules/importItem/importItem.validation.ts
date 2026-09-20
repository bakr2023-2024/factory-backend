import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateImportItems = {
  query: fields.paginate("ImportItem").extend({
    supplierId: fields.idParam.optional(),
    variantId: fields.idParam.optional(),
    importId: fields.idParam.optional(),
    itemId: fields.idParam.optional(),
    supplierName: fields.name.optional(),
    itemName: fields.name.optional(),
    minPrice: fields.unitPriceParam.optional(),
    maxPrice: fields.unitPriceParam.optional(),
  }),
};
export const getImportItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createImportItem = {
  body: z.strictObject({
    importId: fields.idBody,
    variantId: fields.idBody,
    quantity: fields.quantity,
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const updateImportItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    importId: fields.idBody.optional(),
    variantId: fields.idBody.optional(),
    quantity: fields.quantity.optional(),
    unitPrice: fields.unitPriceBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteImportItem = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateImportItemsDTO = z.infer<typeof paginateImportItems.query>;
export type getImportItemParamsDTO = z.infer<typeof getImportItem.params>;
export type createImportItemBodyDTO = z.infer<typeof createImportItem.body>;
export type updateImportItemParamsDTO = z.infer<typeof updateImportItem.params>;
export type updateImportItemBodyDTO = z.infer<typeof updateImportItem.body>;
export type deleteImportItemParamsDTO = z.infer<typeof deleteImportItem.params>;
