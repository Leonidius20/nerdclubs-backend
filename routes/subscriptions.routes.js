import { Router } from "express";
import authenticateJWT from "../middlewares/authenticate.middleware.js";
import checkBodyFieldsCurry from "../middlewares/check.body.fields.middleware.js";
import controller from "../controllers/subscriptions.controller.js";

const router = Router();

router.get("/",
    authenticateJWT,
    controller.getSubscribedCommunities
);

router.post("/",
    authenticateJWT,
    checkBodyFieldsCurry(["community_id"]),
    controller.subscribe
);

router.get("/posts",
    authenticateJWT,
    controller.getSubscribedPosts
);

router.delete("/",
    authenticateJWT,
    checkBodyFieldsCurry(["community_id"]),
    controller.unsubscribe
);

export default router;
