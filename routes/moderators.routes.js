import { Router } from "express";
import controller from "../controllers/moderators.controller.js";
import checkCommunityOwnership from "../middlewares/check.community.ownership.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/", controller.getAllInCommunity);
router.post("/", authenticateJWT, checkCommunityOwnership, controller.add);
router.delete("/", authenticateJWT, checkCommunityOwnership, controller.remove);


export default router;