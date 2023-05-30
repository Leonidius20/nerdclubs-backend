import { Router } from "express";
import controller from "../controllers/moderators.controller.js";
import checkCommunityOwnership from "../middlewares/check.community.ownership.js";
import authenticateJWT from "../middlewares/authenticate.middleware.js";
import checkBodyFieldsCurry from "../middlewares/check.body.fields.middleware.js";
import checkUrlParamsCurry from "../middlewares/check.url.params.middleware.js";

const router = Router();

router.get("/", 
    checkUrlParamsCurry(['community_url']),
    controller.getAllInCommunity
);
router.post("/", 
    authenticateJWT, 
    checkBodyFieldsCurry(['user_id', 'community_id']),
    checkCommunityOwnership, 
    controller.add
);

router.delete("/", 
    authenticateJWT, 
    checkCommunityOwnership,
    checkBodyFieldsCurry(['user_id', 'community_id']),
    controller.remove
);


export default router;