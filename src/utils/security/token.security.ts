import jwt from "jsonwebtoken";
export const signToken = (
  payload: jwt.JwtPayload,
  options: jwt.SignOptions = {
    expiresIn: Number(process.env["JWT_EXPIRES_IN"]),
  },
) => jwt.sign(payload, process.env["JWT_SECRET"]!, options);
export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    return jwt.verify(token, process.env["JWT_SECRET"]!) as jwt.JwtPayload;
  } catch (err) {
    return null;
  }
};
