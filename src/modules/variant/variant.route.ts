import express from "express";
import * as variantController from "./variant.controller";
import * as validators from "./variant.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateVariants), variantController.getVariants);
router.get("/:id",validation(validators.getVariant), variantController.getVariant);
router.post("/",validation(validators.createVariant), variantController.createVariant);
router.patch("/:id",validation(validators.updateVariant), variantController.updateVariant);
router.delete("/:id",validation(validators.deleteVariant), variantController.deleteVariant);

export default router;

