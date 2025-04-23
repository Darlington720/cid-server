import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

// export const generateRandomString = (length) => {
//   return crypto.randomBytes(length).toString("hex"); // Generates a random string
// };

export const generateRandomString = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.randomBytes(length);
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters[randomValues[i] % characters.length];
  }
  return result;
};

export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  return OTP;
};

export const generateEnrollmentToken = () => {
  return `E${generateRandomString(9)}`.toUpperCase(); // e.g., "ENROLL-9fbd1234fabc"
};

export function generateUniqueID() {
  const uuid = uuidv4(); // Generate UUID
  const timestamp = Date.now(); // Get current timestamp in milliseconds
  return `${uuid}-${timestamp}`;
}


