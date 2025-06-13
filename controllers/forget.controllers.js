import dbConnectionPromise from "../config/db.js";
import { validationResult } from "express-validator";
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN
} from "../config/env.js";

// reset password
export const resetPassword = async (req, res, next) => {
	const dbConnection = await dbConnectionPromise;
	const connection = await dbConnection.getConnection();
  await connection.beginTransaction();

	try {
		const { password, cpassword } = req.body;

		const email = req.body.email?.toLowerCase();

		const errors = validationResult(req);

	    if (!errors.isEmpty()) {
	      const messages = errors.array().map(err => err.msg).join(', ');
	      const error = new Error(messages);
	      error.name = 'ValidationError';
	      error.statusCode = 400;
	      throw error;
	    }

	    const [existingUser] = await connection.query(
	      "SELECT id FROM users WHERE email = ?",
	      [email]
	    );

	    if (!existingUser || existingUser.length === 0) {
	      const error1 = new Error("User not found. Please Login again...");
	      error1.statusCode = 400;
	      throw error1;
	    }

	    const hashedPassword = await bcrypt.hash(password, 10);

	    const accessToken = jwt.sign(
	      { id: existingUser[0].id },
	      ACCESS_TOKEN_SECRET,
	      { expiresIn: ACCESS_EXPIRES_IN }
	    );

	    const refreshToken = jwt.sign(
	      { id: existingUser[0].id },
	      REFRESH_TOKEN_SECRET,
	      { expiresIn: REFRESH_EXPIRES_IN }
	    );

	    const [updatePsword] = await connection.query(
	    	"UPDATE `users` SET password = ?, rem_token = ? WHERE email = ?",
	    	[hashedPassword, refreshToken, email]
	    );

	    if (!updatePsword) {
	    	const error = new Error("Failed to update password. Try again...");
	    	error.statusCode = 500;
	    	throw error;
	    }

	    return res.status(200).json({
	      isSuccess: true,
	      message: "Reset successful!",
	      token: accessToken
	    });
	} 

	catch (error) {
	    // Rollback transaction in case of any error
	    await connection.rollback();

	    console.log("Reset password error: ", error);
	    next(error);
	} 

	finally {
	  // Release the connection back to the pool
	  await connection.release();
	}
}

// remove user account
export const userAccount = async (req, res, next) => {
	try {
		const { user_id } = req.params;

		const errors = validationResult(req);

	  if (!errors.isEmpty()) {
	    const messages = errors.array().map(err => err.msg).join(', ');
	    const error = new Error(messages);
	    error.name = 'ValidationError';
	    error.statusCode = 400;
	    throw error;
	  }

	  const db = await dbConnectionPromise;

	  const [existingUser] = await db.query(
	  	"SELECT id FROM users WHERE id = ?",
	    [parseInt(user_id, 10)]
	  );

	  if (!existingUser || existingUser.length === 0) {
	    const error1 = new Error("User not found. Please Login again...");
	    error1.statusCode = 400;
	    throw error1;
	  }

	  const [deleteAccount] = await db.query(
	  	"DELETE FROM users WHERE id = ?", 
	  	[parseInt(user_id, 10)]
	  );

	  if (!deleteAccount) {
	  	const error = new Error("Failed to delete account. Please try again...");
	  	error.statusCode = 500;
	  	throw error;
	  }

	  return res.sendStatus(200);
	}

	catch (error) {
		console.log("Delete user account error: ", error);
		next(error);
	}
}