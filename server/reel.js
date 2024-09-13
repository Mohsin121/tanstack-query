const express = require("express");
const router = express.Router();
const AWS = require('aws-sdk');
const multer = require('multer');
const uuid = require('uuid').v4; 
let Reel = require("../../models/Reel");
const bodyParser = require('body-parser');
const axios = require('axios');
let auth = require("../auth");

let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require("express-http-response");



// Configure AWS S3
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
//   signatureVersion: 'v4',
// });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4',
});
const bucketName = process.env.AWS_BUCKET_NAME;

router.use(bodyParser.urlencoded({extended: true}))


// Configure Multer to use memory storage
// const storage = multer.memoryStorage();
// const fileFilter = (req, file, cb) => {
//   if (file.mimetype.split('/')[0] === 'video') {
//     cb(null, true);
//   } else {
//     cb(null, false); 
//   }
// };
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 100000000000 } 
// });

// router.use((error, req, res, next) => {
//  if(error instanceof  multer.MulterError){
//   if(error.code === "LIMIT_FILE_SIZE"){
//     return res.status(400).json({
//          message:"File is too large"
//     })
//   }
//  }  
// })



router.get('/generate-presigned-url',  async  (req, res, next) => {
  const {fileName, fileType} = req.query;

  if(!fileType || fileType === "") {
    return next(new BadRequestResponse("File Type is required"));
}

   if(!fileName || fileName === "") {
  return next(new BadRequestResponse("File name is required"));
  }

  
  const typeCheck = fileType.split("/")[0]
  if(typeCheck != "video"){
    return next(new BadRequestResponse("Please upload a video file"));
  }

  const ext = fileType.split("/")[1];
  const key = `uploads/${uuid()}-${fileName}`; 

  const s3Params = {
    Bucket: bucketName,
    Key: key, 
    Expires: 60 * 4,  
    ContentType: `video/${ext}`
  };

  try {
    const url = await s3.getSignedUrlPromise('putObject', s3Params);
    return next(new OkResponse({ preSignedUrl: url, key: key }));
  } catch (error) {
    console.error("Error generating presigned URL:", error.message);
    return next(new BadRequestResponse(error.message));
  }
});


router.post('/create', async (req, res, next) => {
  const { user, description, key } = req.body;
  const videoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

  try {
    const reel = new Reel({
      user,
      description,
      videoUrl
    });
    await reel.save();

    return next(new OkResponse("Reel Uploaded Successfully"));
  } catch (error) {
    console.error('Failed to save video data:', error);
    return next(new BadRequestResponse(error.message));
  }
});





// router.post('/upload',  async (req, res, next) => {
//   try {
//     const file = req.file;
//     console.log("Uploaded file info", file);

//     if (!file) {
//       return res.status(400).json({
//         error: "Invalid file type. Please upload a video file."
//       });
//     }

//     const finalFilename = `uploads/${uuid()}-${file.originalname}`;

//     const params = {
//       Bucket: bucketName,
//       Key: finalFilename,
//       Body: file.buffer,
//       ContentType: file.mimetype, 
//     };

//     const uploadResult = await s3.upload(params).promise();

//     const reel = new Reel({
//         user : req.body.user,
//         description: req.body.description, 
//         videoUrl: uploadResult.Location 

//     })

//     const savedReel = await reel.save();
//     console.log("Uploaded Reel Details:", savedReel);

//     res.status(201).json({
//       message: "Reel uploaded successfully",
//       reel: savedReel
//     });

//   } catch (e) {
//     console.error("Error in upload:", e.message);
//     res.status(500).send({ message: "Error processing request", error: e.message });
//   }
// });

module.exports = router;
