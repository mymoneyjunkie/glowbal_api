import { body } from 'express-validator';

export const otpValidator = {
	// sendOTP: [
	//     body("email")
	//       .trim()
	//       .notEmpty()
	//       .withMessage("Email Address required")
	//       .bail()
	// 	  .isEmail()
	// 	  .withMessage("Invalid email")
	// 	  .normalizeEmail()
	// ],

	verifyOTP: [
		body("token")
			.trim()
			.notEmpty()
			.withMessage("OTP required")
			.matches(/^[^<>]*$/)
			.withMessage("Invalid OTP"),
		body("otp")
			.trim()
			.notEmpty()
			.withMessage("OTP required")
			.matches(/^[^<>]*$/)
			.withMessage("Invalid OTP"),
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