import express from "express";
import * as consumptionController from "./consumption.controller";
import * as validators from "./consumption.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateConsumptions), consumptionController.getConsumptions);
router.get("/:id",validation(validators.getConsumption), consumptionController.getConsumption);
router.post("/",validation(validators.createConsumption), consumptionController.createConsumption);
router.patch("/:id",validation(validators.updateConsumption), consumptionController.updateConsumption);
router.delete("/:id",validation(validators.deleteConsumption), consumptionController.deleteConsumption);

export default router;

