import z from "zod";
import { fields } from "../../utils/generalFields";

export const paginateImports = {
  query: fields.paginate("Import").extend({
    supplierId: fields.idParam.optional(),
    supplierName: fields.name.optional(),
    supplierNumber:fields.number.optional()
  }),
};
export const getImport = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const createImport = {
  body: z.strictObject({
    supplierId: fields.idBody,
    notes: z.string().optional(),
  }),
};
export const updateImport = {
  params: z.strictObject({
    id: fields.idParam,
  }),
  body: z.strictObject({
    supplierId: fields.idBody.optional(),
    notes: z.string().optional(),
  }),
};
export const deleteImport = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};

export type paginateImportsDTO = z.infer<typeof paginateImports.query>;
export type getImportParamsDTO = z.infer<typeof getImport.params>;
export type createImportBodyDTO = z.infer<typeof createImport.body>;
export type updateImportParamsDTO = z.infer<typeof updateImport.params>;
export type updateImportBodyDTO = z.infer<typeof updateImport.body>;
export type deleteImportParamsDTO = z.infer<typeof deleteImport.params>;
