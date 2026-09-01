import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME?.trim(),
  api_key: process.env.CLOUD_KEY?.trim(),
  api_secret: process.env.CLOUD_SECRET?.trim(),
});


export default cloudinary;
