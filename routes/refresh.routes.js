import { Router } from "express";

const refreshRouter = Router();

import { handleRefreshToken } from "../controllers/refresh.controllers.js";

refreshRouter.get("/", handleRefreshToken);

export default refreshRouter;