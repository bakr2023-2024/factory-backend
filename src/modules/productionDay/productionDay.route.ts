import express from "express";
import * as productionDayController from "./productionDay.controller";
import * as validators from "./productionDay.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateProductionDays), productionDayController.getProductionDays);
router.get("/:id",validation(validators.getProductionDay), productionDayController.getProductionDay);
router.post("/",validation(validators.createProductionDay), productionDayController.createProductionDay);
router.patch("/:id",validation(validators.updateProductionDay), productionDayController.updateProductionDay);
router.delete("/:id",validation(validators.deleteProductionDay), productionDayController.deleteProductionDay);

export default router;

