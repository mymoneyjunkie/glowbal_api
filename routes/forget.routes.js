import { Router } from "express";

import { resetPassword, userAccount } from "../controllers/forget.controllers.js";

import { passwordValidator } from "../validators/reset.validators.js";

const forgetRouter = Router();

forgetRouter.post("/reset", passwordValidator.resetPassword, resetPassword);

// forgetRouter.post("/verify", otpValidator.verifyOTP, verifyOTP);

export default forgetRouter;