import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import childrenRouter from "./children";
import screeningsRouter from "./screenings";
import appointmentsRouter from "./appointments";
import therapyPlansRouter from "./therapy_plans";
import reportsRouter from "./reports";
import dashboardRouter from "./dashboard";
import videoAnalysisRouter from "./video_analysis";
import availabilityRouter from "./availability";
import specialtyFeesRouter from "./specialty_fees";
import paymentsRouter from "./payments";
import rescheduleRouter from "./reschedule";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(childrenRouter);
router.use(screeningsRouter);
router.use(appointmentsRouter);
router.use(availabilityRouter);
router.use(specialtyFeesRouter);
router.use(paymentsRouter);
router.use(rescheduleRouter);
router.use(therapyPlansRouter);
router.use(reportsRouter);
router.use(dashboardRouter);
router.use(videoAnalysisRouter);
router.use(billingRouter);

export default router;
