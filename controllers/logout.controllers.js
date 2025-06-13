import dbConnectionPromise from "../config/db.js";

export const signOut = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.AIKGDL;

    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized: No refresh token" });
    }

    const dbConnection = await dbConnectionPromise;

    // Clear token from both tables
    await dbConnection.query("UPDATE users SET rem_token = NULL WHERE rem_token = ?", [refreshToken]);

    res.clearCookie("AIKGDL", {
      sameSite: "None",
      httpOnly: true,
      secure: true // Use secure cookies in production
    });

    return res.status(204).send("Logged out successfully");
  } catch (error) {
	console.error("Logout error:", error);
    next(error);
  }
};