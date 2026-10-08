import express from "express";
import * as customerReturnItemController from "./customerReturnItem.controller";
import * as validators from "./customerReturnItem.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateCustomerReturnItems), customerReturnItemController.getCustomerReturnItems);
router.get("/:id",validation(validators.getCustomerReturnItem), customerReturnItemController.getCustomerReturnItem);
router.post("/",validation(validators.createCustomerReturnItem), customerReturnItemController.createCustomerReturnItem);
router.patch("/:id",validation(validators.updateCustomerReturnItem), customerReturnItemController.updateCustomerReturnItem);
router.delete("/:id",validation(validators.deleteCustomerReturnItem), customerReturnItemController.deleteCustomerReturnItem);

export default router;

