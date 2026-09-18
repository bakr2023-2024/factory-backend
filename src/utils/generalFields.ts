import z from "zod";
export const fields = {
  id: z
    .string()
    .refine((val) => val.trim() && !isNaN(Number(val)) && Number(val) > 0, {
      message: "ID can only be a positive integer",
    })
    .transform((val) => Number(val)),
  name: z.string().min(3).max(100),

  paginate: z.strictObject({
    page: z
      .string()
      .refine((val) => val.trim() && !isNaN(Number(val)) && Number(val) > 0, {
        message: "page can only be a positive integer",
      })
      .transform((val) => Number(val))
      .default(1),
    size: z
      .string()
      .refine((val) => val.trim() && !isNaN(Number(val)) && Number(val) > 0, {
        message: "skip can only be a positive integer",
      })
      .transform((val) => Number(val))
      .default(20),
  }),
};
export type paginateDTO = z.infer<typeof fields.paginate>;
