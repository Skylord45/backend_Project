import {v2 as cloudinary} from 'cloudinary';
import fs from "fs"
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {

  try {
    if(!localFilePath) return null;
    // upload on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type : "auto"
    })
    // file uploaded successfully
    console.log("filr upload succesfully on cloudinary", response.url);
    // for user we return response what he needed he can get from response
   
    fs.unlinkSync(localFilePath);
    return response;

  } catch (error) {
      fs.unlinkSync(localFilePath); // we can remove from locally saved 
      return null;
  }
}

export { uploadOnCloudinary }