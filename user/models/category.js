// const mongoose =  require('mongoose');

import mongoose from "mongoose";
const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        trim: true,
    },
    course:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Course",
    }],
})


export default mongoose.model("category", categorySchema);