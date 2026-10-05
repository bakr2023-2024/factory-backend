import express from "express";
import * as itemController from "./item.controller";
import * as validators from "./item.validation";
import validation from "../../middleware/validation.middleware";
import { authorization } from "../../middleware/auth.middleware";
const router = express.Router();

router.get(
  "/",
  authorization(),
  validation(validators.paginateItems),
  itemController.getItems,
);
router.get(
  "/:id",
  authorization(),
  validation(validators.getItem),
  itemController.getItem,
);
router.post(
  "/",
  authorization(["ADMIN"]),
  validation(validators.createItem),
  itemController.createItem,
);
router.patch(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.updateItem),
  itemController.updateItem,
);
router.delete(
  "/:id",
  authorization(["ADMIN"]),
  validation(validators.deleteItem),
  itemController.deleteItem,
);

export default router;

