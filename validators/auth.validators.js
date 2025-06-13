import { body } from 'express-validator';

export const registerValidator = {
	create: [
	    body("email")
	      .trim()
	      .notEmpty()
	      .withMessage("Email Address required")
	      .bail()
		  .isEmail()
		  .withMessage("Invalid email")
		  .normalizeEmail(),
	    body("password")
	      .trim()
	      .notEmpty()
	      .withMessage("Password required")
	      .matches(/^[^<>]*$/)
	      .withMessage("Invalid password"),
	    body("cpassword")
	      .notEmpty()
	      .withMessage("Confirm password is required")
	      .custom((value, { req }) => {
	        if (value !== req.body.password) {
	          throw new Error("Passwords do not match");
	        }
	        return true;
	      })
  	]
};

export const loginValidator = {
	create: [
		body("email")
	      .trim()
	      .notEmpty()
	      .withMessage("Email Address required")
	      .bail()
		  .isEmail()
		  .withMessage("Invalid email")
		  .normalizeEmail(),
	    body("password")
	      .trim()
	      .notEmpty()
	      .withMessage("Password required")
	      .matches(/^[^<>]*$/)
	      .withMessage("Invalid password")
	]
};

export const otpValidator = {
	sendOTP: [
	    body("email")
	      .trim()
	      .notEmpty()
	      .withMessage("Email Address required")
	      .bail()
		  .isEmail()
		  .withMessage("Invalid email")
		  .normalizeEmail()
	]
}