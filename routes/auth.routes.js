import { Router } from "express";

import { signUp, signIn, sendOTP } from "../controllers/auth.controllers.js";

import { registerValidator, loginValidator, otpValidator } from "../validators/auth.validators.js";

const authRouter = Router();

authRouter.post("/sign-in", loginValidator.create, signIn);

authRouter.post("/sign-up", registerValidator.create, signUp);

authRouter.post("/send", otpValidator.sendOTP, sendOTP);

export default authRouter;