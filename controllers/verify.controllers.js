import dbConnectionPromise from "../config/db.js";
import { validationResult } from "express-validator";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import {
	OTP_TOKEN_SECRET,
	SHORT_TOKEN_SECRET,
	SHORT_EXPIRES_IN
} from "../config/env.js";

// validate otp
export const verifyOTP = async (req, res, next) => {
	try {
		const { token, otp } = req.body;

		const email = req.body.email?.toLowerCase();

		const errors = validationResult(req);

	    if (!errors.isEmpty()) {
	      const messages = errors.array().map(err => err.msg).join(', ');
	      const error = new Error(messages);
	      error.name = 'ValidationError';
	      error.statusCode = 400;
	      throw error;
	    }

	    const db = await dbConnectionPromise;

	    let verifiedUser;
	    try {
	      verifiedUser = jwt.verify(token, OTP_TOKEN_SECRET);
	    } catch (err) {
	      return res.sendStatus(401);
	    }

	    if (verifiedUser.number.toString() !== otp.toString()) {
	    	return res.sendStatus(403);
	    }

	    if (verifiedUser.email.toLowerCase() !== email.toLowerCase()) {
	    	return res.sendStatus(403);
	    }

	    const [existingUser] = await db.query(
	      "SELECT id FROM users WHERE email = ?",
	      [email]
	    );

	    if (!existingUser || existingUser.length === 0) {
	      const error1 = new Error("User not found. Please Login again...");
	      error1.statusCode = 400;
	      throw error1;
	    }

	    const resetToken = jwt.sign(
	    	{email, type: true },
	    	SHORT_TOKEN_SECRET,
	    	{ expiresIn: SHORT_EXPIRES_IN }
	    )

	    return res.status(200).json({
	    	isSuccess: true,
	    	token: resetToken
	    })
	}

	catch (error) {
		console.log("Verify otp error: ", error);
		next(error);
	}
}