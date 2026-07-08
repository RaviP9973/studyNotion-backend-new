import User from "../models/User.js";
import OTP from "../models/OTP.js";
import otpGenerator from "otp-generator";
// import otpGenerator from "otp-generator";
import bcrypt from "bcrypt";
import Profile from "../models/Profile.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
import redisClient from "../config/redis.js"
import emailTemplate from "../mail/emailVerificationTemplate.js"
import { publishToQueue } from "../config/rabbitmq.js";
// send otp
export const sendOTP = async (req, res) => {
  try {
    //fetch email from req
    const { email } = req.body;

    //check if user already exists
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: "User already registered",
      });
    }

    const rateLimitKey = `otp:rateLimit:${email}`

    const rateLimit = await redisClient.get(rateLimitKey)

    if (rateLimit) {
      return res.status(403).json({
        success: false,
        message: "Please wait for 1 minute before sending another OTP",
      });
    }
    await redisClient.set(rateLimitKey, "1", { EX: 60 });
    //generate otp
    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // const otpPayload = { email, otp };

    const optKey = `otp:${email}`

    //create entry for otp
    await redisClient.set(optKey, otp, { EX: 5 * 60 });


    const message = {
      email: email,
      title: "verification email",
      body: emailTemplate(otp),
    }

    await publishToQueue("email-queue", message);


    // return response
    res.status(200).json({
      success: true,
      meassage: "OTP sent successfully",
      // otp,
    });

  } catch (error) {
    console.log("Error in generating opt", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// signup
export const signUp = async (req, res) => {
  try {
    //fetch details
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      // contactNumber,
      otp,
    } = req.body;
    // console.log("req.bodY",req.body);

    //validations
    if (
      !firstName ||
      !lastName ||
      !password ||
      !confirmPassword ||
      !email ||
      // !contactNumber ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "Please fill all details",
      });
    }

    //pass and confirm pass same or not
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password should be same ",
      });
    }

    //check for existinig user
    console.log("check for existinig user");
    const [existingUser, recentOtp] = await Promise.all([
      User.findOne({ email }),
      // OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1),
      redisClient.get(`otp:${email}`)
    ])
    // const existingUser = await User.findOne({ email });
    console.log("existingUser", existingUser);
    console.log('recivevotp', recentOtp);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user already exits",
      });
    }

    //find most recent otp
    // const recentOtp = await OTP.find({ email })
    //   .sort({ createdAt: -1 })
    // .limit(1);

    // const recentOtp = await OTP.findOne({ email }).sort({ createdAt: -1 }).limit(1);
    //validate otp
    // console.log(otp);
    if (!recentOtp || recentOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Enter correct OTP",
      });
    }

    await redisClient.del(`otp:${email}`);
    //Hash password
    const hashedPassord = await bcrypt.hash(password, 10);

    //entry in db

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      // contactNumber,
      password: hashedPassord,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    //return response
    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    console.log("Error in signup process", error);

    return res.status(500).json({
      success: false,
      message: "User cannot be registered. please try again",
    });
  }

  //
};

//login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    //check user exists or not
    const existingUser = await User.findOne({ email }).populate("additionalDetails").lean();

    if (!existingUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    //generated jwt , after passord match
    const payload = {
      email: existingUser.email,
      id: existingUser._id,
      accountType: existingUser.accountType,
    };
    // console.log(password);
    // console.log(existingUser.password);
    const passMatch = await bcrypt.compare(password, existingUser.password);
    if (passMatch) {
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      //create cookie and send response

      delete existingUser.password;
      delete existingUser.token;
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true
      };
      res.cookie("token", token, options).status(200).json({
        success: true,
        user: existingUser,
        message: "Logged in succesfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        meassage: "Password didn't match",
      });
    }
  } catch (error) {
    console.log("Error while logging in", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// change pass
export const changePassword = async (req, res) => {
  try {
    // console.log("entered backend")
    const { password, newPassword } = req.body;
    const userId = req.user.id;

    if (!password || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please fill all details",
      });
    }
    if (newPassword == password) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be same as old password",

      })
    }

    // if (newPassword !== confirmNewPassword) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "New password and confirm password do not match",
    //   });
    // }
    const userDetails = await User.findById(userId).select('password').lean();

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    const passMatch = await bcrypt.compare(password, userDetails.password);

    if (!passMatch) {
      return res.status(403).json({
        success: false,
        message: "Password did'nt mathced",
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// logout
export const logout = async (req, res) => {
  try {
    const authHeader = req.header("Authorization") || req.header("authorization");
    const tokenFromHeader = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    const token = req.cookies?.token || req.body?.token || tokenFromHeader;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token missing",
      });
    }

    // Verify token to get expiration time
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Calculate remaining time in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = decoded.exp - currentTime;

    if (timeRemaining > 0) {
      // Add token to Redis blacklist
      await redisClient.set(`bl_${token}`, "true", { EX: timeRemaining });
    }

    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });

  } catch (error) {
    console.error("Error in logout:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to log out",
    });
  }
};
