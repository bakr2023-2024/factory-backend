import z from "zod";
import { fields } from "../../utils/generalFields";

export const getSheet = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export const getSummary = {
  query: z.strictObject({
    from: fields.date.optional(),
    to: fields.date.optional(),
    seasonId: fields.idParam.optional(),
  }),
};
export type getSheetParamsDTO = z.infer<typeof getSheet.params>;
export type getSummaryQueryDTO = z.infer<typeof getSummary.query>;
