import { Router } from "express";
import controller from "../controllers/community.bans.controller.js";
import checkCommunityModeratorship from "../middlewares/check.community.moderatorship.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";
import checkBodyFieldsCurry from "../middlewares/check.body.fields.middleware.js";
import checkUrlParamsCurry from "../middlewares/check.url.params.middleware.js";

const router = Router();

router.get("/banned", 
    authenticateJWT,
    checkUrlParamsCurry(["community_id"]),
    (req, _, next) => {
        req.body.community_id = req.query.community_id;
        next();
    },
    checkCommunityModeratorship,
    controller.getAllBannedUsersInCommunity);

router.post("/banned", 
    authenticateJWT,
    checkBodyFieldsCurry(["community_id", "user_id"]),
    checkCommunityModeratorship,
    controller.banUserInCommunity);

router.delete("/banned", 
    authenticateJWT,
    checkBodyFieldsCurry(["community_id", "user_id"]),
    checkCommunityModeratorship,
    controller.unbanUserInCommunity);

export default router;