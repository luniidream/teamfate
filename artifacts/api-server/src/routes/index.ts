import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import membersRouter from "./members";
import shiniesRouter from "./shinies";
import shinyTypesRouter from "./shiny-types";
import bountiesRouter from "./bounties";
import eventsRouter from "./events";
import statsRouter from "./stats";
import pokedexRouter from "./pokedex";
import uploadsRouter from "./uploads";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/admin", adminRouter);
router.use("/members", membersRouter);
router.use("/shinies", shiniesRouter);
router.use("/shiny-types", shinyTypesRouter);
router.use("/bounties", bountiesRouter);
router.use("/events", eventsRouter);
router.use("/stats", statsRouter);
router.use("/pokedex", pokedexRouter);
router.use("/uploads", uploadsRouter);

export default router;
