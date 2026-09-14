import bcrypt from "bcryptjs";
export const hash = async (text: string) => await bcrypt.hash(text, 10);
export const compare = async (plain: string, hashed: string) =>
  await bcrypt.compare(plain, hashed);
