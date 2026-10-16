import z from "zod";
import { fields } from "../../utils/generalFields";
import { FilterRule } from "../../utils/utils";

export const paginateImportItems = {
  query: fields.paginate("ImportItem").extend({
    supplierId: fields.integerParam.optional(),
    variantId: fields.integerParam.optional(),
    importId: fields.integerParam.optional(),
    itemId: fields.integerParam.optional(),
    supplierName: fields.name.optional(),
    supplierNumber: fields.name.optional(),
    itemName: fields.name.optional(),
    minPrice: fields.doubleParam.optional(),
    maxPrice: fields.doubleParam.optional(),
  }),
};
export const getImportItem = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};
export const createImportItem = {
  body: z.strictObject({
    importId: fields.integerBody,
    variantId: fields.integerBody,
    quantity: fields.integerBody,
    unitPrice: fields.doubleBody.optional(),
    notes: z.string().optional(),
  }),
};
export const updateImportItem = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
  body: z.strictObject({
    importId: fields.integerBody.optional(),
    variantId: fields.integerBody.optional(),
    quantity: fields.integerBody.optional(),
    unitPrice: fields.doubleBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteImportItem = {
  params: z.strictObject({
    id: fields.integerParam,
  }),
};

export type paginateImportItemsDTO = z.infer<typeof paginateImportItems.query>;
export type getImportItemParamsDTO = z.infer<typeof getImportItem.params>;
export type createImportItemBodyDTO = z.infer<typeof createImportItem.body>;
export type updateImportItemParamsDTO = z.infer<typeof updateImportItem.params>;
export type updateImportItemBodyDTO = z.infer<typeof updateImportItem.body>;
export type deleteImportItemParamsDTO = z.infer<typeof deleteImportItem.params>;
export const importItemRules: FilterRule<paginateImportItemsDTO>[] = [
  { path: ["variantId"], param: "variantId" },
  { path: ["importId"], param: "importId" },
  { path: ["variant", "itemId"], param: "itemId" },
  { path: ["import", "supplierId"], param: "supplierId" },
  { path: ["import", "supplier", "name"], param: "supplierName", op: "contains" },
  { path: ["import", "supplier", "number"], param: "supplierNumber", op: "contains" },
  { path: ["variant", "item", "name"], param: "itemName", op: "contains" },
  { path: ["unitPrice"], param: "minPrice", op: "gte" },
  { path: ["unitPrice"], param: "maxPrice", op: "lte" },
  { path: ["createdAt"], param: "createdFrom", op: "gte" },
  { path: ["createdAt"], param: "createdTo", op: "lte" },
];
