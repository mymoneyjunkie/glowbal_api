import jwt from "jsonwebtoken";

import { ACCESS_TOKEN_SECRET } from "../config/env.js";

const authMiddleware = async (req, res, next) => {
	try {
		let token = req.headers.authorization != undefined ? req.headers.authorization.startsWith("Bearer") : "";

		let error1 = "";
    
	    if (!token) {
	     	error1 = new Error("Access Denied / Unauthorized request");
	     	error1.statusCode = 401;
	     	throw error1;
	    }

	    try {
	        // console.log(req.headers.authorization);
	      
	        if (req.headers.authorization.startsWith("Bearer")) {
	          token = req.headers.authorization?.split(' ')[1]; // Get token from "Bearer <token>"
	        }
	      
	        // console.log(token);
	      
	        const verifiedUser = await jwt.verify(token, ACCESS_TOKEN_SECRET);

	        // console.log(verifiedUser);

	        req.user = verifiedUser; // Attach user info to request
	        next(); // Proceed to next middleware or route handler
	    } catch (err) {
	        error1 = new Error("Invalid Token");
	        error1.statusCode = 401;
	        throw error1;
	    }
	}

	catch (error) {
		next(error);
	}
}

export default authMiddleware;