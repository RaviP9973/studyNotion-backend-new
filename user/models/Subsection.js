// const mongoose  = require("mongoose");
import mongoose from "mongoose";

const subsectionSchema = new mongoose.Schema({
    title:{
        type:String,
    },
    timeDuration :{
        type:String,
    },
    description:{
        type:String,
    },
    videoUrl:{
        type:String,
    }
})

export default mongoose.model("Subsection",subsectionSchema);