import z from "zod";
export const signup = {
  body: z
    .strictObject({
      name: z.string().min(3),
      number: z.string().min(7).max(30),
      password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "password and confirmPassword mismatch",
      path: ["confirmPassword"],
    }),
};
export const login = {
  body: z.strictObject({
    name: z.string(),
    password: z.string(),
  }),
};
export type signupDTO = z.infer<typeof signup.body>;
export type loginDTO = z.infer<typeof login.body>;
