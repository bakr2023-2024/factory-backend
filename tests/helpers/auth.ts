import request from "supertest";
import app from "../../src/app";
import prisma from "../../src/db/prisma";
import {
  signToken,
  verifyToken,
} from "../../src/utils/security/token.security";
import { Role } from "../../src/db/generated/prisma/enums";

let token = "";
export const json = <T>(data: T) => JSON.parse(JSON.stringify(data));

export const login = async () => {
  const admin =
    (await prisma.user.findFirst({ where: { username: "test_admin" } })) ??
    (await prisma.user.create({
      data: {
        username: "test_admin",
        number: "987654321",
        password: "123xyzXYZ",
        role: Role.ADMIN,
      },
    }));

  token = signToken({ sub: admin.id.toString() });
};

export const auth = () => {
  const bearer = `Bearer ${token}`;
  return {
    get: (url: string) => request(app).get(url).set("Authorization", bearer),
    post: (url: string) => request(app).post(url).set("Authorization", bearer),
    patch: (url: string) =>
      request(app).patch(url).set("Authorization", bearer),
    delete: (url: string) =>
      request(app).delete(url).set("Authorization", bearer),
  };
};
