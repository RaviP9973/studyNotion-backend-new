import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connect =() =>{
    mongoose.connect(process.env.MONGODB_URL)
    .then(() => {
        console.log("Db connection successful");
    })
    .catch( (error)=>{
        console.log("Db connection failed");
        console.error(error);
        process.exit(1);
    })
}