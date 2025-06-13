import { Router } from "express";

import {
  get_subscription_home,
  post_subscription_plan,
  post_subscription,
  get_user_subscriptions,
  cancel_subscription,
  get_subscription_status,
  check_subscription_status
} from "../controllers/payment.controllers.js";

import { subscriptionValidators } from "../validators/payment.validators.js";

const paymentRouter = Router();

paymentRouter.get("/home/:email", 
  subscriptionValidators.getHome,
  get_subscription_home
);

paymentRouter.post("/plans", 
  subscriptionValidators.getPlans,
  post_subscription_plan
);

paymentRouter.post("/subscribe", 
  subscriptionValidators.subscribe,
  post_subscription
);

paymentRouter.post("/subscriptions",
  subscriptionValidators.getSubscriptions, 
  get_user_subscriptions
);

paymentRouter.post("/subscription-cancel",
  subscriptionValidators.cancelSubscription, 
  cancel_subscription
);

paymentRouter.post("/subscriptions-status",
  subscriptionValidators.subscriptionStatus, 
  get_subscription_status
);

paymentRouter.post("/subscription-current",
  subscriptionValidators.checkSubscriptionStatus, 
  check_subscription_status
);

export default paymentRouter;