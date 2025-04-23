import { db, PRIVATE_KEY } from "../config/config.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { generateOTP, generateRandomString, generateUniqueID } from "./helper_functions.js";
import saveData from "../utilities/saveData.js";
import sendEmail from "./send_mail.js";

export const getUsers = async ({
  id,
  surname,
  other_names,
  email,
  active = false,
}) => {
  try {
    let values = [];
    let where = "";
    let extra_join = "";

    if (id) {
      where += " AND users.id = ?";
      values.push(id);
    }

    if (surname) {
      where += " AND users.first_name = ?";
      values.push(surname);
    }

    if (other_names) {
      where += " AND users.other_names = ?";
      values.push(other_names);
    }

    if (email) {
      where += " AND users.email = ?";
      values.push(email);
    }

    if (active) {
      extra_join +=
        " INNER JOIN login_credentials ON users.id = login_credentials.user_id";
    }

    let sql = `
      SELECT 
        users.id,
        users.first_name,
        users.other_names,
        users.email,
        users.gender,
        users.photo,
        users.created_on,
        login_credentials.user_id,
        login_credentials.is_active
      FROM users 
      LEFT JOIN login_credentials ON users.id = login_credentials.user_id
      WHERE users.deleted = 0 ${where} ORDER BY users.created_on DESC`;

    const [results] = await db.execute(sql, values);
    // console.log("results", results);
    return results;
  } catch (error) {
    console.log("error", error);
  }
};

export const createLoginDetails = async ({ user_id, email }) => {
  console.log("email", { user_id, email });
  const salt = await bcrypt.genSalt();
  const sysGenPwd = generateRandomString(6);
  const hashedPwd = await bcrypt.hash(sysGenPwd, salt);
  console.log("salt", salt);

  console.log("sysGenPwd", sysGenPwd);

  console.log("hashedPwd", hashedPwd);

  // lets first check if the account is already created
  const [existingUser] = await getUsers({
    id: user_id,
  });
  console.log("existingUser", existingUser);

  if (!existingUser) {
    // save to the db
    const data = {
      user_id,
      email,
      pwd: hashedPwd,
      created_by: null,
      sys_gen_pwd: true,
      is_verified: false,
    };

    const save_id = await saveData({
      table: "login_credentials",
      data,
      id: null,
    });

    // get the user
    const user = await getUsers({
      id: save_id,
      active: true,
    });

    return user;
  } else {
    throw new Error("User already exists");
  }
};

export const getUserLastLoginDetails = async ({ user_id, lastRecord }) => {
  try {
    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get the last two logins for the user
    const sql = `
      SELECT 
        id,
        user_id,
        session_id,
        machine_ipaddress,
        logged_in
      FROM user_logins 
      WHERE user_id = ? 
      ORDER BY logged_in DESC 
      LIMIT 2`;

    const [results] = await db.execute(sql, [user_id]);

    if (lastRecord) {
      // If lastRecord is true, return the last login
      return results[0];
    }

    // If no login history exists
    if (!results.length) {
      return null;
    }

    // If only one login exists, return it
    if (results.length === 1) {
      return results[0];
    }

    // Return the second-to-last login (index 1)
    return results[1];
  } catch (error) {
    console.error('Error fetching login details:', error);
    throw error;
  }
};

export const loginUser = async ({ email, password, user_id, ip_address }) => {
  try {
    let values = [];
    let where = "";

    if (email) {
      where += " AND email = ?";
      values.push(email);
    }

    if (user_id) {
      where += " AND user_id = ?";
      values.push(user_id);
    }

    let sql = `SELECT * FROM login_credentials WHERE deleted = 0 ${where}`;
    let [results] = await db.execute(sql, values);

    const user = results[0];

    if (!user) {
      throw new Error("Invalid Email or Password");
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new Error("Invalid Email or Password");
    }

    if (!user.is_active) {
      throw new Error("Account suspended, Please contact the admin for rectification!");
    }

    let otpData = null;
    if (user.sys_gen_pwd) {
      // Generate OTP
      const otp = generateOTP(6);
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

      // Save OTP
      otpData = {
        user_id: user.user_id,
        otp,
        expiry: otpExpiry,
        used: false
      };

      await saveData({
        table: 'password_reset_otps',
        data: otpData,
        id: null
      });

      // Send OTP email
      await sendEmail({
        to: user.email,
        subject: 'Password Change Required - OTP',
        message: `Your OTP for password change is: ${otp}\nThis OTP will expire in 10 minutes.`
      });
    }

    const session_id = generateUniqueID();

    const tokenData = {
      id: user.user_id,
      session_id: session_id,
    };

    const token = jwt.sign(tokenData, PRIVATE_KEY, {
      expiresIn: "1d",
    });

    // Create session for the login
    const data = {
      user_id: user.user_id,
      session_id,
      machine_ipaddress: ip_address,
      logged_in: new Date()
    };

    await saveData({
      table: "user_logins",
      data,
      id: null,
    });

    return {
      success: true,
      token,
      user: {
        id: user.user_id,
        email: user.email
      },
      requirePasswordChange: Boolean(user.sys_gen_pwd)
    };

  } catch (error) {
    throw {
      success: false,
      message: error.message || "Login failed",
    };
  }
};
