import { v2 as cloudinary } from "cloudinary"

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const removeFromCloudinary = async(localPath) => {

  if(!localPath) return null;

  await cloudinary.uploader.destroy(localPath, {
    resource_type: "auto",
  })
  
  console.log("file remove from cloudinary !!");
}

export { removeFromCloudinary }





// cloudinary.uploader.destroy('public_id_of_the_file', function(result) {
//   console.log(result);
// });