import User from "../models/User.js";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { frontendUrl } from "../constants.js/url.js";
import { publishToQueue } from "../config/rabbitmq.js";
dotenv.config();

export const resetPasswordToken = async (req, res) => {
  try {
    //get email form req
  const email = req.body.email;
  //check user for this email , email validate
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({
      success: false,
      message: "Your email is not registered with us",
    });
  }
  //create token
  const token = crypto.randomUUID();
  //update user by adding token and expiration time
  const updatedDetails = await User.findOneAndUpdate({email:email},{
    token:token,
    resetPasswordExprires:Date.now() + 5*60*1000
  },{
    new:true
  })
  // create url
  const url = `${frontendUrl}/update-password/${token}`;
  // send mail containing url
  const emailMessage = {
    email:email,
    title:"Password Reset Link",
    body: `password reset Link : ${url}`
  }
  await publishToQueue("email-queue", emailMessage);
  // return response
  return res.status(200).json({
    success:true,
    message:"Email sent successfully , please check email "
  })
  
  } catch (error) {
    return res.status(500).json({
        success:false,
        message:error.message
    })
  }
};

//reset pass token

//reset pass
export const resetPassword = async(req,res)=>{
    try {
        // fetch data
    const {password,confirmPassword,token} = req.body;
    // validation 

    if(password !== confirmPassword) {
        return res.json({
            success:false,
            message:"password did'nt matched"
        });
    }
    // get userDetails from db using token 
    const userDetails = await User.findOne({token:token});
    //if no enrty found - invalid token or time expired
    if(!userDetails){
        return res.json({
            success:false,
            message:"Token invalid",
        });
    }

    if(userDetails.resetPasswordExprires < Date.now()){
        return res.json({
            success:false,
            message:"Token expired || sesion expired"
        });
    }
    //update password after hashing
    const hashedPassord = await bcrypt.hash(password,10);

    await User.findOneAndUpdate(
        {token:token},
        {password:hashedPassord},
        {new:true},
    )
    //return response
    return res.status(200).json({
        success:true,
        message:"Password changed succesfully",
    })
    } catch (error) {
        console.log("Error while changing password");
        return res.status(500).json({
            success:false,
            message:"Something went wrong while password changing"
        })
    }
}