import z from "zod";
import { fields } from "../../utils/generalFields";
import { StockMovementType } from "../../db/generated/prisma/enums";

export const paginateStockMovements = {
  query: fields
    .paginate("StockMovement")
    .extend({
      variantId: fields.idParam.optional(),
      occurredFrom: fields.dateTime.optional(),
      occurredTo: fields.dateTime.optional(),
      itemName: fields.name.optional(),
      type: z.enum(Object.values(StockMovementType)).optional(),
      typeRef: fields.idParam.optional(),
      quantityChanged: fields.quantityParam.optional(),
    })
    .refine((data) => !data.typeRef || (data.typeRef && data.type), {
      message: "A type is needed for typeRef to reference",
      path: ["typeRef"],
    }),
};
export const getStockMovement = {
  params: z.strictObject({
    id: fields.idParam,
  }),
};
export type paginateStockMovementsDTO = z.infer<
  typeof paginateStockMovements.query
>;
export type getStockMovementParamsDTO = z.infer<typeof getStockMovement.params>;
