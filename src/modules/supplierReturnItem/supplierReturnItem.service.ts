import { SupplierReturnItem, Prisma } from "../../db/generated/prisma/client";
import {
  SupplierReturnItemFindManyArgs,
  SupplierReturnItemWhereInput,
} from "../../db/generated/prisma/models";
import prisma from "../../db/prisma";
import {
  ConflictException,
  InternalServerException,
  NotFoundException,
} from "../../utils/exceptions";
import { buildQuery } from "../../utils/utils";
import { PaginationType } from "../../utils/types/types";
import {
  createSupplierReturnItemBodyDTO,
  deleteSupplierReturnItemParamsDTO,
  getSupplierReturnItemParamsDTO,
  paginateSupplierReturnItemsDTO,
  updateSupplierReturnItemBodyDTO,
  updateSupplierReturnItemParamsDTO,
} from "./supplierReturnItem.validation";

export const getSupplierReturnItems = async (
  pagination: paginateSupplierReturnItemsDTO,
): Promise<PaginationType<SupplierReturnItem[]>> => {
  const { page, size } = pagination;
  const query: SupplierReturnItemFindManyArgs = {};
  const where: SupplierReturnItemWhereInput = {};
  const orderBy: Prisma.SupplierReturnItemOrderByWithRelationInput = {};

  // inject fields into query
  const supplierReturn: Prisma.SupplierReturnWhereInput = {};
  const importItem: Prisma.ImportItemWhereInput = {};
  const unitPrice: Prisma.DecimalFilter = {};
  if (pagination.supplierReturnId)
    where.supplierReturnId = pagination.supplierReturnId;
  if (pagination.importItemId) where.importItemId = pagination.importItemId;
  if (pagination.supplierId) supplierReturn.supplierId = pagination.supplierId;
  if (pagination.supplierName) {
    supplierReturn.supplier = {
      name: { contains: pagination.supplierName, mode: "insensitive" },
    };
  }
  if (pagination.supplierNumber) {
    if (supplierReturn.supplier)
      supplierReturn.supplier.number = {
        contains: pagination.supplierNumber,
        mode: "insensitive",
      };
    else
      supplierReturn.supplier = {
        number: { contains: pagination.supplierNumber, mode: "insensitive" },
      };
  }
  if (pagination.itemName)
    importItem.variant = {
      item: { name: { contains: pagination.itemName, mode: "insensitive" } },
    };
  if (pagination.unitWeight) {
    if (importItem.variant)
      importItem.variant.unitWeight = pagination.unitWeight;
    else importItem.variant = { unitWeight: pagination.unitWeight };
  }
  if (pagination.quantity) where.quantity = pagination.quantity;
  if (pagination.minPrice) unitPrice.gte = pagination.minPrice;
  if (pagination.maxPrice) unitPrice.lte = pagination.maxPrice;
  if (pagination.minPrice || pagination.maxPrice) where.unitPrice = unitPrice;

  if (Object.keys(supplierReturn).length) where.supplierReturn = supplierReturn;
  if (Object.keys(importItem).length) where.importItem = importItem;
  if (Object.keys(unitPrice).length) where.unitPrice = unitPrice;

  buildQuery(pagination, query, where, orderBy);

  const data = await prisma.supplierReturnItem.findMany(query);
  const totalCount = await prisma.supplierReturnItem.count({ where });
  const totalPages = Math.ceil(totalCount / size);
  return {
    data,
    page,
    size,
    totalPages,
    totalCount,
  };
};
export const getSupplierReturnItem = async (
  params: getSupplierReturnItemParamsDTO,
): Promise<SupplierReturnItem> => {
  const supplierReturnItem = await prisma.supplierReturnItem.findUnique({
    where: { id: params.id },
  });
  if (!supplierReturnItem)
    throw new NotFoundException("SupplierReturnItem not found");
  return supplierReturnItem;
};
export const createSupplierReturnItem = async (
  body: createSupplierReturnItemBodyDTO,
): Promise<SupplierReturnItem> => {
  try {
    const supplierReturnItem = await prisma.supplierReturnItem.create({
      data: body,
    });
    return supplierReturnItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2003")
        throw new ConflictException(
          "No supplierReturn/importItem exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const updateSupplierReturnItem = async (
  params: updateSupplierReturnItemParamsDTO,
  body: updateSupplierReturnItemBodyDTO,
): Promise<SupplierReturnItem> => {
  try {
    const supplierReturnItem = await prisma.supplierReturnItem.update({
      where: { id: params.id },
      data: body,
    });
    return supplierReturnItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("SupplierReturnItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "No supplierReturn/importItem exists with that ID",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
export const deleteSupplierReturnItem = async (
  params: deleteSupplierReturnItemParamsDTO,
): Promise<SupplierReturnItem> => {
  try {
    const supplierReturnItem = await prisma.supplierReturnItem.delete({
      where: { id: params.id },
    });
    return supplierReturnItem;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025")
        throw new NotFoundException("SupplierReturnItem not found");
      else if (err.code === "P2003")
        throw new ConflictException(
          "A child record still depends on this parent record",
        );
    }
    throw new InternalServerException((err as Error).message);
  }
};
