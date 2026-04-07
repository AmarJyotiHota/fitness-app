import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activityRouter from "./activity";
import foodRouter from "./food";
import adminRouter from "./admin";
import aiRouter from "./ai";
import waterRouter from "./water";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/activity", activityRouter);
router.use("/food", foodRouter);
router.use("/admin", adminRouter);
router.use("/ai", aiRouter);
router.use("/water", waterRouter);
router.use("/analytics", analyticsRouter);

export default router;
