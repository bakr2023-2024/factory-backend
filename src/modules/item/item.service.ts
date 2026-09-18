import { Item, Prisma } from "../../db/generated/prisma/client";
import { ItemWhereInput } from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { PaginationType } from "../../utils/types/types";
import {
  createItemBodyDTO,
  deleteItemParamsDTO,
  getItemParamsDTO,
  paginateItemsDTO,
  updateItemBodyDTO,
  updateItemParamsDTO,
} from "./item.validation";

export const getItems = async (
  pagination: paginateItemsDTO,
): Promise<PaginationType<Item[]>> => {
  const { page, size } = pagination;
  const where: ItemWhereInput|undefined = pagination.name
    ? { name: { contains: pagination.name, mode: "insensitive" } }
    : undefined;
  const query = {
    skip: (page - 1) * pagination.size,
    take: size,
    where,
  };
  const data = await prisma.item.findMany(query);
  const totalCount = await prisma.item.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
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
