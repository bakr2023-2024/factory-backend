import { Prisma } from "../../db/generated/prisma/client";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import {
  createItemBodyDTO,
  deleteItemParamsDTO,
  getItemParamsDTO,
  paginateItemsDTO,
  updateItemBodyDTO,
  updateItemParamsDTO,
} from "./item.validation";

export const getItems = async (pagination: paginateItemsDTO) => {
  const totalCount = await prisma.item.count();
  const page = pagination.page;
  const size = pagination.size > 0 ? pagination.size : totalCount;
  const totalPages = Math.ceil(totalCount / size);
  const query: any = {
    skip: (page - 1) * pagination.size,
    take: size,
  };
  if (pagination.name) {
    query["where"] = {
      name: { contains: pagination.name, mode: "insensitive" },
    };
  }
  const items = await prisma.item.findMany(query);
  return {
    items,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getItem = async (params: getItemParamsDTO) => {
  const item = await prisma.item.findUnique({ where: { id: params.id } });
  if (!item) throw new NotFoundException("Item not found");
  return item;
};
export const createItem = async (body: createItemBodyDTO) => {
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
) => {
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
export const deleteItem = async (params: deleteItemParamsDTO) => {
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
