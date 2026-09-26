import express from "express";
import * as seasonController from "./season.controller";
import * as validators from "./season.validation";
import validation from "../../middleware/validation.middleware";

const router = express.Router();

router.get("/",validation(validators.paginateSeasons), seasonController.getSeasons);
router.get("/:id",validation(validators.getSeason), seasonController.getSeason);
router.post("/",validation(validators.createSeason), seasonController.createSeason);
router.patch("/:id",validation(validators.updateSeason), seasonController.updateSeason);
router.delete("/:id",validation(validators.deleteSeason), seasonController.deleteSeason);

export default router;

