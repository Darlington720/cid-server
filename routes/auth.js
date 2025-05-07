import { Router } from "express";
import { loginUser } from "../helpers/users.js";
import saveData from "../utilities/saveData.js";
import { db } from "../config/config.js";
import bcrypt from "bcrypt";
import auth from "../middleware/auth.js";

const router = Router();

router.post('/login', async (req, res) => {
  try {
     const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const ip_address = req.ip;

    const result = await loginUser({ 
      email, 
      password, 
      ip_address 
    });

    res.header('x-auth-token', `Bearer ${result.token}`);
    res.json(result);
  } catch (error) {
    // console.error('Login error:', error);
    res.status(401).json({error: error.message});
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Get OTP record
    const [otpRecords] = await db.execute(
      'SELECT * FROM password_reset_otps WHERE user_id = (SELECT user_id FROM login_credentials WHERE email = ? ORDER BY id DESC LIMIT 1) AND used = false ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    const otpRecord = otpRecords[0];

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    if (new Date() > new Date(otpRecord.expiry)) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // // Hash new password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(newPassword, salt);

    // // Update password and sys_gen_pwd flag
    // await db.execute(
    //   'UPDATE login_credentials SET password = ?, sys_gen_pwd = false WHERE email = ?',
    //   [hashedPassword, email]
    // );

    // Mark OTP as used
    await db.execute(
      'UPDATE password_reset_otps SET used = true WHERE id = ?',
      [otpRecord.id]
    );

    res.json({
      success: true,
      message: 'OTP verify successfully'
    })

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP'
    });
  }
});


router.post('/change-password', auth, async (req, res) => {
    try {
      const { email, newPassword } = req.body;
  
      if (!email || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email and new password are required'
        });
      }
  
      // Get user login credentials
      const [userCredentials] = await db.execute(
        'SELECT * FROM login_credentials WHERE email = ? AND sys_gen_pwd = true AND deleted = 0',
        [email]
      );
  
      if (!userCredentials.length) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request or password already changed'
        });
      }
  
      // Check if OTP was verified
      const [verifiedOTP] = await db.execute(
        'SELECT * FROM password_reset_otps WHERE user_id = ? AND used = true ORDER BY id DESC LIMIT 1',
        [userCredentials[0].user_id]
      );
  
      if (!verifiedOTP.length) {
        return res.status(400).json({
          success: false,
          message: 'Please verify OTP first'
        });
      }
  
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update password and sys_gen_pwd flag
      await db.execute(
        'UPDATE login_credentials SET password = ?, sys_gen_pwd = false WHERE email = ? AND deleted = 0',
        [hashedPassword, email]
      );
  
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
  
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to change password'
      });
    }
  });

export default router;
