import { v2 as cloudinary } from "cloudinary";

export const uploadImageToCloudinary = async(file,folder,height,qulity)=>{
    const options = {folder}
    if(height){
        options.height= height;
    }
    if(qulity){
        options.qulity = qulity;
    }
    options.resource_type = "auto";

    return await cloudinary.uploader.upload(file.tempFilePath,options)
};