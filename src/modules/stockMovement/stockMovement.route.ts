import express from "express";
import * as stockMovementController from "./stockMovement.controller";
import * as validators from "./stockMovement.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateStockMovements), stockMovementController.getStockMovements);
router.get("/:id",validation(validators.getStockMovement), stockMovementController.getStockMovement);

export default router;

