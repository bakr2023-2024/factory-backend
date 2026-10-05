import { User } from "../../db/generated/prisma/client";

declare module "express-serve-static-core" {
  interface Request {
    user?: User;
  }
}
