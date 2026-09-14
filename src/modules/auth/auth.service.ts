import prisma from "../../db/prisma";
import { BadRequestException, ConflictException } from "../../utils/exceptions";
import { hash, compare } from "../../utils/security/hash.security";
import { loginDTO, signupDTO } from "./auth.validation";

export const createUser = async (userDTO: signupDTO) => {
  const user = await prisma.user.findUnique({
    where: { name: userDTO.name },
  });
  if (user) throw new ConflictException("User with this name already exists");
  try {
    return await prisma.user.create({
      data: {
        name: userDTO.name,
        number: userDTO.number,
        password: await hash(userDTO.password),
      },
      omit: { password: true },
    });
  } catch (err) {
    throw new BadRequestException(
      `Failed to create user: ${(err as Error).message}`,
    );
  }
};

export const findUser = async (userDTO: loginDTO) => {
  const user = await prisma.user.findUnique({ where: { name: userDTO.name } });
  return user && (await compare(userDTO.password, user.password)) ? user : null;
};
