import jwt from "jsonwebtoken";
import { PRIVATE_KEY } from "../config/config.js";
import { getUserLastLoginDetails } from "../helpers/users.js";

const AUTH_TIMEOUT = 5000; // 5 seconds timeout for auth operations

const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Authentication timeout'));
    }, AUTH_TIMEOUT);
  });

  try {
    // Race between auth operations and timeout
    const decoded = await Promise.race([
      jwt.verify(token, PRIVATE_KEY),
      timeoutPromise
    ]);

    const lastLogin = await Promise.race([
      getUserLastLoginDetails({
        user_id: decoded.id,
        lastRecord: true,
      }),
      timeoutPromise
    ]);

    if (!lastLogin || lastLogin.session_id !== decoded.session_id) {
      return res.status(401).send({
        success: false,
        message: "Invalid token.",
      });
    }

    // Set the user on the request if authentication is successful
    req.user = decoded;
    next();
  } catch (error) {
    if (error.message === 'Authentication timeout') {
      return res.status(408).send({
        success: false,
        message: "Authentication request timed out.",
      });
    }

    return res.status(401).send({
      success: false,
      message: "Invalid token.",
    });
  }
};
export default auth;
