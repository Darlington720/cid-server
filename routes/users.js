import { Router } from "express";
import { getUserLastLoginDetails, getUsers } from "../helpers/users.js";
import saveData from "../utilities/saveData.js";
import { v4 as uuidv4 } from "uuid";
import { generateRandomString } from "../helpers/helper_functions.js";
import bcrypt from "bcrypt";
import sendEmail from "../helpers/send_mail.js";
import softDelete from "../utilities/softDelete.js";
import auth from "../middleware/auth.js";

const router = Router();

router.get("/", auth, async (req, res) => {
  let arr = [];
  const users = await getUsers({});

  for (const user of users) {
    const lastLogin = await getUserLastLoginDetails({
      user_id: user.id,
    });

    arr.push({
      user,
      lastLogin,
    });
  }
  res.send({
    success: true,
    result: arr,
  });
});

router.get("/myProfile", auth, async (req, res) => {
  try {
    const id = req.user.id;

    if (!id) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }

    const [user] = await getUsers({
      id,
    });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    const lastLogin = await getUserLastLoginDetails({
      user_id: user.id,
    });

    res.send({
      success: true,
      result: {
        user,
        lastLogin,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
});

router.post("/", auth, async (req, res) => {
  const { first_name, other_names, email, gender } = req.body;
  
  // Input validation
  if (!first_name || !email || !gender) {
    return res.status(400).send({
      success: false,
      message: "Required fields missing",
    });
  }

  try {
    const [existingUser] = await getUsers({
      email,
    });

    if (existingUser) {
      return res.status(400).send({
        success: false,  // Changed from true to false
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt();
    const sysGenPwd = generateRandomString(6);
    const hashedPwd = await bcrypt.hash(sysGenPwd, salt);

    const id = uuidv4();

    const data = {
      id,
      first_name,
      other_names,
      email,
      gender,
      created_on: new Date(),
    };

    // Save user data
    const save_id = await saveData({
      table: "users",
      data,
    });

    const [user] = await getUsers({
      email,
    });

    const login_data = {
      user_id: user.id,
      email,
      password: hashedPwd,
      created_by: "",
      created_on: new Date(),
      sys_gen_pwd: true,
      is_verified: false,
    };

    // Save login credentials
    const login_details = await saveData({
      table: "login_credentials",
      data: login_data,
      id: null,
    });

    // Send welcome email
    await sendEmail({
      to: email,
      subject: "User Account Creation",
      message: `Your account has been successfully created \n Following are your user credentials: \n
        email: ${email}
        password: ${sysGenPwd}
      `,
    });

    return res.status(201).send({  // Changed status to 201 for resource creation
      success: true,
      message: "Login details created successfully",
      result: user,
    });
  } catch (error) {
    console.error('User creation error:', error);
    return res.status(500).send({  // Added proper error status code
      success: false,
      message: "Internal server error",
    });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    
    const { id } = req.params;
  
    if (!id) {
      return res.status(400).send({
        success: false,
        message: "User ID is required",
      });
    }
  
    // Delete user and related data
    await softDelete({
      table: "users",
      idColumn: "id",
      id,
    })

    await softDelete({
      table: "login_credentials",
      idColumn: "user_id",
      id,
    })
  
    res.send({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).send({
      success: false,
      message: "Internal server error",
    });
  }
})

export default router;
