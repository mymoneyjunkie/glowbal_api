import { Router } from "express";

const logoutRouter = Router();

import { signOut } from "../controllers/logout.controllers.js";

logoutRouter.get("/", signOut);

export default logoutRouter;