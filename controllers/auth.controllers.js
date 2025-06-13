import { validationResult } from "express-validator";

import dbConnectionPromise from "../config/db.js";

import jwt from "jsonwebtoken";

import bcrypt from "bcryptjs";

import crypto from "crypto";

import {
  NODE_ENV,
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
  STRIPE_SECRET_KEY,
  OTP_TOKEN_SECRET,
  OTP_EXPIRES_IN
} from "../config/env.js";

import stripe from "stripe";

const Stripe = new stripe(STRIPE_SECRET_KEY);

// register user using email
export const signUp = async (req, res, next) => {
  const dbConnection = await dbConnectionPromise;
  const connection = await dbConnection.getConnection();
  await connection.beginTransaction();

  try {
    const errors = validationResult(req);
    const email = req.body.email?.toLowerCase();
    const { password, cpassword } = req.body;

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      throw error;
    }

    const [existingUsers] = await connection.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      const error = new Error('Email already found. Please Login to continue...');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUserQuery = `
      INSERT INTO users (name, email, password, created_at, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [insertResult] = await connection.query(insertUserQuery, [
      email.split('@')[0], email, hashedPassword, new Date().toISOString().split('T')[0], '127.0.0.1'
    ]);

    if (!insertResult?.insertId) {
      throw new Error(`User registration failed. Please try again.`);
    }

    const userId = insertResult.insertId;
    try {
      const customer = await Stripe.customers.create({
        email,
        name: email.split('@')[0],
      });
    } catch (err) {
      throw new Error('Stripe customer creation failed. Please try again.');
    }

    const payload = { id: userId };
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
    const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

    const [response2] = await connection.query(
      "UPDATE users SET rem_token = ? WHERE id = ?",
      [refreshToken, userId]
    );

    // Commit the transaction after everything is successful
    await connection.commit();

    res.cookie('AIKGDL', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production",
      sameSite: 'None',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return res.status(201).json({
      isSuccess: true,
      message: 'Registration successful',
      token: accessToken
    });

  } catch (error) {
    await connection.rollback();
    console.error('Sign Up error:', error.message);
    next(error);
  } finally {
    await connection.release();
  }
};

// login user using email
export const signIn = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    const email = req.body.email?.toLowerCase();
    const { password } = req.body;

    if (!errors.isEmpty()) {
      const messages = errors.array().map(err => err.msg).join(', ');
      const error = new Error(messages);
      error.name = 'ValidationError';
      error.statusCode = 400;
      throw error;
    }

    const dbConnection = await dbConnectionPromise;

    const [existingUsers] = await dbConnection.query(
      "SELECT id, password FROM users WHERE email = ?",
      [email]
    );

    if (!existingUsers || existingUsers.length === 0) {
      const error = new Error("No account found with this email. Please register");
      error.statusCode = 400;
      throw error;
    }

    const isMatch = await bcrypt.compare(password, existingUsers[0].password);
              
    if (!isMatch) {
      const error1 = new Error("Invalid email or password");
      error1.statusCode = 400;
      throw error1;
    }

    const accessToken = jwt.sign(
      { id: existingUsers[0].id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { id: existingUsers[0].id },
      REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_EXPIRES_IN }
    );

    await dbConnection.query(
      "UPDATE users SET created_at = ?, rem_token = ? WHERE id = ?",
      [new Date().toISOString().split('T')[0], refreshToken, existingUsers[0].id]
    );

    res.cookie('AIKGDL', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === "production", // ensure HTTPS is used
      sameSite: 'None', // if frontend is on a different domain
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      // domain: NODE_ENV === "production" ? '.yourdomain.com' : ""
    });

    return res.status(200).json({
      isSuccess: true,
      message: "Login successful",
      token: accessToken
    });
  }

  catch (error) {
    console.log("Sign In error: ", error);

    next(error);
  }
};

function generateSecureOTP() {
  const otp = crypto.randomInt(10000, 100000); // 10000 to 99999
  return otp.toString();
}

// send otp in mail
export const sendOTP = async (req, res, next) => {
  try {
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

      const [existingUser] = await db.query(
        "SELECT id FROM users WHERE email = ?", 
        [email]
      );

      if (!existingUser || existingUser.length === 0) {
        const error = new Error("User not found. Please log in again...");
        error.statusCode = 404;
        throw error;
      }

      const otp = generateSecureOTP();

      // console.log(otp);

      if (!otp || otp.length !== 5) {
        throw new Error("Failed to generate a valid OTP");
      }

      const otpToken = jwt.sign(
        { id: existingUser.id, email, number: otp },
        OTP_TOKEN_SECRET,
        { expiresIn: OTP_EXPIRES_IN }
      );

      // TODO: Send `otp` via email using your mailing service
      // console.log(`OTP for user ${user_id}: ${otp}`);

      return res.status(200).json({
        isSuccess: true,
        token: otpToken,
        message: 'OTP sent successfully'
      });
  }

  catch (error) {
    console.log("Send OTP error: ", error);

    next(error);
  }
}