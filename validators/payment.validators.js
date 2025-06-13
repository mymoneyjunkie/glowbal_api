import { param, body } from "express-validator";
import { PlanValue } from "../utils/planValue.js";

// Validation rules for subscription endpoint
export const subscriptionValidators = {
  getHome: [
    param("email")
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
  ],

  getPlans: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
  ],

  subscribe: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),

    body("plan")
      .trim()
      .notEmpty()
      .withMessage("Plan Required")
      .custom(value => {
        const planValue = value.toUpperCase();

        // Check if the plan exists in the PlanValue enum keys
        if (!Object.keys(PlanValue).includes(planValue)) {
          throw new Error('Invalid plan found...');
        }

        return true;
      })
  ],

  getSubscriptions: [
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
  ],

  cancelSubscription: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),

    body("subscription_id")
      .trim()
      .notEmpty()
      .withMessage("Subscription required")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid Subscription found...")
  ],

  subscriptionStatus: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail()
  ],

  checkSubscriptionStatus: [
    body("email")
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .bail()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),

    body("customer")
      .trim()
      .notEmpty()
      .withMessage("Session not found.")
      .matches(/^[^<>]*$/)
      .withMessage("Invalid Session Found...")
  ]
}; 