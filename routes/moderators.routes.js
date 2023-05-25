import { Router } from "express";
import controller from "../controllers/moderators.controller.js";
import checkCommunityOwnership from "../middlewares/check.community.ownership.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";

const router = Router();

router.get("/", controller.getAllInCommunity);
router.post("/", (req, res, next) => {
    req.test = req.community_id ? 420 : 69;
    res.json({test: req.test});
}, authenticateJWT, checkCommunityOwnership, controller.add);
router.delete("/", authenticateJWT, checkCommunityOwnership, controller.remove);


export default router;