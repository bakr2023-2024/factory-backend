import express from "express";
import * as productionEntryController from "./productionEntry.controller";
import * as validators from "./productionEntry.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateProductionEntries), productionEntryController.getProductionEntries);
router.get("/:id",validation(validators.getProductionEntry), productionEntryController.getProductionEntry);
router.post("/",validation(validators.createProductionEntry), productionEntryController.createProductionEntry);
router.patch("/:id",validation(validators.updateProductionEntry), productionEntryController.updateProductionEntry);
router.delete("/:id",validation(validators.deleteProductionEntry), productionEntryController.deleteProductionEntry);

export default router;

