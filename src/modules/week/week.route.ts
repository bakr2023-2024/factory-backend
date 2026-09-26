import express from "express";
import * as weekController from "./week.controller";
import * as validators from "./week.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateWeeks), weekController.getWeeks);
router.get("/:id",validation(validators.getWeek), weekController.getWeek);
router.post("/",validation(validators.createWeek), weekController.createWeek);
router.patch("/:id",validation(validators.updateWeek), weekController.updateWeek);
router.delete("/:id",validation(validators.deleteWeek), weekController.deleteWeek);

export default router;

