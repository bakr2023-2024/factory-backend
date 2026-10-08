import express from "express";
import * as supplierReturnItemController from "./supplierReturnItem.controller";
import * as validators from "./supplierReturnItem.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateSupplierReturnItems), supplierReturnItemController.getSupplierReturnItems);
router.get("/:id",validation(validators.getSupplierReturnItem), supplierReturnItemController.getSupplierReturnItem);
router.post("/",validation(validators.createSupplierReturnItem), supplierReturnItemController.createSupplierReturnItem);
router.patch("/:id",validation(validators.updateSupplierReturnItem), supplierReturnItemController.updateSupplierReturnItem);
router.delete("/:id",validation(validators.deleteSupplierReturnItem), supplierReturnItemController.deleteSupplierReturnItem);

export default router;

