import { Router } from "express";
import controller from "../controllers/password.login.controller.js";
import checkBodyFieldsCurry from "../middlewares/check.body.fields.middleware.js";

const router = Router();

router.post("/", 
    checkBodyFieldsCurry(['username', 'password']), 
    controller.login
);

export default router;