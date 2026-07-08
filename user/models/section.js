// const mongoose = require("mongoose")
// const Subsection = require("./Subsection")

import mongoose from "mongoose";
import Subsection from "./Subsection.js";

const sectionSchema = new mongoose.Schema({
    sectionName:{
        type:String,
    },
    subSection:[
        {
            type:mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"Subsection",
        }
    ]
})

export default mongoose.model("Section",sectionSchema);