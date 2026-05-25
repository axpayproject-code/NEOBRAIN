import { Router, type IRouter } from "express";
import healthRouter from "./health";
import childrenRouter from "./children";
import screeningsRouter from "./screenings";
import appointmentsRouter from "./appointments";
import therapyPlansRouter from "./therapy_plans";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import videoAnalysisRouter from "./video_analysis";

const router: IRouter = Router();

router.use(healthRouter);
router.use(childrenRouter);
router.use(screeningsRouter);
router.use(appointmentsRouter);
router.use(therapyPlansRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(videoAnalysisRouter);

export default router;
