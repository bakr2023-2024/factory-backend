import { NextFunction, Request, Response } from "express";
import { ForbiddenException, UnauthorizedException } from "../utils/exceptions";
import { verifyToken } from "../utils/security/token.security";
import prisma from "../db/prisma";
import { Role } from "../db/generated/prisma/enums";

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let decoded, user;
  const [bearer, token] = req.headers.authorization?.split(" ") || [];
  if (bearer === "Bearer" && (decoded = verifyToken(token))) {
    if (
      (user = await prisma.user.findUnique({
        where: { id: Number(decoded.sub) },
      }))
    ) {
      req.user = user;
      return next();
    }
  }
  throw new UnauthorizedException("Missing or invalid access token");
};
export const authorization = (roles: Role[] = ["USER", "ADMIN"]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user!.role))
      throw new ForbiddenException("Access denied");
    return next();
  };
};
