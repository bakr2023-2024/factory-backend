import express from "express";
import * as laborerController from "./laborer.controller";
import * as validators from "./laborer.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateLaborers), laborerController.getLaborers);
router.get("/:id",validation(validators.getLaborer), laborerController.getLaborer);
router.post("/",validation(validators.createLaborer), laborerController.createLaborer);
router.patch("/:id",validation(validators.updateLaborer), laborerController.updateLaborer);
router.delete("/:id",validation(validators.deleteLaborer), laborerController.deleteLaborer);

export default router;

