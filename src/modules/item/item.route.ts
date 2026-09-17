import express from "express";
import * as itemController from "./item.controller";
import * as validators from "./item.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateItems), itemController.getItems);
router.get("/:id",validation(validators.getItem), itemController.getItem);
router.post("/",validation(validators.createItem), itemController.createItem);
router.patch("/:id",validation(validators.updateItem), itemController.updateItem);
router.delete("/:id",validation(validators.deleteItem), itemController.deleteItem);

export default router;

