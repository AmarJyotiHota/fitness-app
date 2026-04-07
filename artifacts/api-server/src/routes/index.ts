import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activityRouter from "./activity";
import foodRouter from "./food";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/activity", activityRouter);
router.use("/food", foodRouter);
router.use("/admin", adminRouter);

export default router;
