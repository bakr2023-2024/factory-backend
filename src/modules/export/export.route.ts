import express from "express";
import * as exportController from "./export.controller";
import * as validators from "./export.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateExports), exportController.getExports);
router.get("/:id",validation(validators.getExport), exportController.getExport);
router.post("/",validation(validators.createExport), exportController.createExport);
router.patch("/:id",validation(validators.updateExport), exportController.updateExport);
router.delete("/:id",validation(validators.deleteExport), exportController.deleteExport);

export default router;

