import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV || 'production'}.local` });

export const {
	NODE_ENV,
	PORT,
	ACCESS_TOKEN_SECRET,
	REFRESH_TOKEN_SECRET,
	SHORT_TOKEN_SECRET,
	OTP_TOKEN_SECRET,
	BASE_URL,
	BASE_URL1,
	BASE_URL2,
	ACCESS_EXPIRES_IN,
	REFRESH_EXPIRES_IN,
	SHORT_EXPIRES_IN,
	OTP_EXPIRES_IN,
	STRIPE_SECRET_KEY,
	ENDPOINT_SECRET,
	HOST,
  	USER,
  	PASSWORD,
  	DATABASE,
  	PLAN_ID1,
  	PLAN_ID2,
  	PLAN_ID3
} = process.env;