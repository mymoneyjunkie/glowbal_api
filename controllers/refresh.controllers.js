import jwt from "jsonwebtoken";

import dbConnectionPromise from "../config/db.js";

import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_EXPIRES_IN } from "../config/env.js";

export const handleRefreshToken = async (req, res, next) => {
  try {
    let refreshToken = req.cookies != undefined ? req.cookies.AIKGDL : '';
    
    // console.log(refreshToken);
    // console.log('Cookies:', req.cookies);

    if (!refreshToken) {
      return res.sendStatus(401);
    }

    const dbConnection = await dbConnectionPromise;

    try {
        const dbConnection = await dbConnectionPromise;

        const [foundUser] = await dbConnection.query(
          "SELECT id FROM users WHERE rem_token = ?",
          [refreshToken]
        );
        // console.log(foundUser, !foundUser);

        if (!foundUser) {
          const error1 = new Error("Access Denied / Unauthorized user"); // forbidden
            error1.statusCode = 401;
            throw error1;
        }

        // evaluate jwt
        const verifiedUser = await jwt.verify(
          refreshToken,
          REFRESH_TOKEN_SECRET
        );

        // console.log(verifiedUser);

        if (Number(verifiedUser.id) != Number(foundUser[0]?.id)) {
          const error1 = new Error("Access Denied / Unauthorized user");
          error1.statusCode = 401;
          throw error1;
        }

          const accessToken = jwt.sign(
            { id: foundUser[0]?.id },
            ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_EXPIRES_IN }
          );

          // console.log(accessToken);

          // res.header("Authorization", accessToken);

          return res.json({
            isSuccess: true,
            message: "successful!",
            token: accessToken
          });
    } 

    catch (error) {
        const error1 = new Error("Invalid Token");
        error1.statusCode = 401;
        throw error1;
    }
  }

  catch (error) {
    next(error);
  }
}