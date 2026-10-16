import { Item, Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { paginated } from "../../utils/generalFields";
import { PaginationType } from "../../utils/types/types";
import { buildQuery } from "../../utils/utils";
import {
  createItemBodyDTO,
  deleteItemParamsDTO,
  getItemParamsDTO,
  itemRules,
  paginateItemsDTO,
  updateItemBodyDTO,
  updateItemParamsDTO,
} from "./item.validation";

export const getItems = async (
  pagination: paginateItemsDTO,
): Promise<PaginationType<Item[]>> => {
  const query = buildQuery(itemRules, pagination);
  const [data, totalCount] = await Promise.all([
    prisma.item.findMany(query),
    prisma.item.count({ where: query.where }),
  ]);
  return paginated(data, pagination, totalCount);
};
export const getItem = async (params: getItemParamsDTO): Promise<Item> => {
  const item = await prisma.item.findUnique({ where: { id: params.id } });
  if (!item) throw new NotFoundException("Item not found");
  return item;
};
export const createItem = async (body: createItemBodyDTO): Promise<Item> => {
  try {
    const item = await prisma.item.create({ data: body });
    return item;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      throw new ConflictException("An item with this name already exists");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateItem = async (
  params: updateItemParamsDTO,
  body: updateItemBodyDTO,
): Promise<Item> => {
  try {
    const item = await prisma.item.update({
      where: { id: params.id },
      data: body,
    });
    return item;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") throw new NotFoundException("Item not found");
      else if (err.code === "P2002")
        throw new ConflictException("An item with this name already exists");
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteItem = async (
  params: deleteItemParamsDTO,
): Promise<Item> => {
  try {
    const item = await prisma.item.delete({ where: { id: params.id } });
    return item;
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      throw new NotFoundException("Item not found");
    }
    throw new InternalServerException((err as Error).message);
  }
};
