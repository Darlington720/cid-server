import jwt from "jsonwebtoken";
import { PRIVATE_KEY } from "../config/config.js";
import { getUserLastLoginDetails } from "../helpers/users.js";


const auth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send({
      success: false,
      message: "Access denied. No token provided.",
    })
  }


  try {
    const decoded = jwt.verify(token, PRIVATE_KEY);
   
    // Continue with further checks if the token is verified
  const lastLogin = await getUserLastLoginDetails({
    user_id: decoded.id,
    lastRecord: true,
  });

  console.log('lastLogin', lastLogin)
  console.log('decoded', decoded)

  if (!lastLogin || lastLogin.session_id !== decoded.session_id) {
    return res.status(401).send({
      success: false,
      message: "Invalid token.",
    })
  }

  // Set the user on the request if authentication is successful
  req.user = decoded;
  next();
  } catch (error) {
    console.log("error", error)
    return res.status(401).send({
      success: false,
      message: "Invalid token.",
    })
  }
};
export default auth;
