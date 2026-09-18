import { Request, Response } from "express";
import { createUser, findUser } from "./auth.service";
import { loginDTO, signupDTO } from "./auth.validation";
import { BadRequestException } from "../../utils/exceptions";
import { signToken } from "../../utils/security/token.security";

export const signup = async (req: Request, res: Response) => {
  const userDTO: signupDTO = req.body;
  const data = await createUser(userDTO);
  return res.status(201).json({ data });
};
export const login = async (req: Request, res: Response) => {
  const userDTO: loginDTO = req.body;
  const user = await findUser(userDTO);
  if (!user) throw new BadRequestException("Invalid credentials");
  const data = signToken({ id: user.id });
  return res.json({ data });
};
