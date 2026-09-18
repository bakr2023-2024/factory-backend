import express from "express";
import * as importController from "./import.controller";
import * as validators from "./import.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateImports), importController.getImports);
router.get("/:id",validation(validators.getImport), importController.getImport);
router.post("/",validation(validators.createImport), importController.createImport);
router.patch("/:id",validation(validators.updateImport), importController.updateImport);
router.delete("/:id",validation(validators.deleteImport), importController.deleteImport);

export default router;

