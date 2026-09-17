import z from "zod";
import { fields } from "../../utils/generalFields";
export enum Role {
  Admin = "ADMIN",
  User = "USER",
}
export const signup = {
  body: z
    .strictObject({
      username: fields.name,
      number: z.string().min(7).max(30),
      role: z.enum(Object.values(Role)).optional().default(Role.User),
      password: z.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/, {
        message:
          "make sure that password at least contains 8 characters, contains a number, a lowercase letter and an uppercase letter",
      }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "password and confirmPassword are mismatched",
      path: ["confirmPassword"],
    }),
};
export const login = {
  body: z.strictObject({
    username: z.string(),
    password: z.string(),
  }),
};
export type signupDTO = z.infer<typeof signup.body>;
export type loginDTO = z.infer<typeof login.body>;
