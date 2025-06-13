import { body, param } from 'express-validator';

export const passwordValidator = {
	resetPassword: [
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
	    }),
	    body("email")
	      .trim()
	      .notEmpty()
	      .withMessage("Email Address required")
	      .bail()
		  .isEmail()
		  .withMessage("Invalid email")
		  .normalizeEmail()
	],

	deleteAccount: [
		param("user_id")
		  .trim()
	      .notEmpty()
	      .withMessage("You need to be logged in. Please log in first.")
	      .isInt({ gt: 0 })
	      .withMessage("We couldn't find the user you're looking for. Please log in again.")
	]
}