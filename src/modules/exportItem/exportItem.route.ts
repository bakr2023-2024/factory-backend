import express from "express";
import * as exportItemController from "./exportItem.controller";
import * as validators from "./exportItem.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateExportItems), exportItemController.getExportItems);
router.get("/:id",validation(validators.getExportItem), exportItemController.getExportItem);
router.post("/",validation(validators.createExportItem), exportItemController.createExportItem);
router.patch("/:id",validation(validators.updateExportItem), exportItemController.updateExportItem);
router.delete("/:id",validation(validators.deleteExportItem), exportItemController.deleteExportItem);

export default router;

