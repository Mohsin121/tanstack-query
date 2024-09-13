const express = require("express");
const router = express.Router();
const AWS = require('aws-sdk');
const uuid = require('uuid').v4; 
let Reel = require("../../models/Reel");
const bodyParser = require('body-parser');
let auth = require("../auth");

let { OkResponse, BadRequestResponse, UnauthorizedResponse , NotFoundResponse} = require("express-http-response");

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: 'v4',
});

const bucketName = process.env.AWS_BUCKET_NAME;

router.use(bodyParser.urlencoded({extended: true}))


//create reel
router.post('/create', auth.required, async (req, res, next) => {
  const { user, description, key } = req.body;

  console.log("Body", req.body)

  if(!user){
    return next(new BadRequestResponse("Please provide user id"));
  }

  if(!key || key === ""){
    return next(new BadRequestResponse("Please provide key"));
  }
  const videoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`;

  try {
    const reel = new Reel({
      user: user,
      description : description,
      videoUrl : videoUrl,
    });
    await reel.save();

    return next(new OkResponse("Reel Uploaded Successfully"));
  } catch (error) {
    console.log('Failed to save video data:', error);
    return next(new BadRequestResponse(error.message));
  }
});


//Get all reels from other users  
router.get('/', auth.required, auth.user, async (req, res, next) => {
  const userId = req.user._id;
  console.log("req user", req.user.email)

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;
  const skip = (page - 1) * limit;

  try {
    const totalReels = await Reel.countDocuments({ user: { $ne: userId } });
    
      const reels = await Reel.find({ user: { $ne: userId } })
                              .sort({ createdAt: -1 })
                              .skip(skip)
                              .limit(limit).populate('user',  'profileImage fullName followers following followersCount followingsCount' )

      const reelsWithLikes = reels.map(reel => ({
          ...reel.toJSON(),
          isLiked: reel.likes.includes(userId),
          isFollowed : reel.user.followers.includes(userId.toString())
      }));

      return next(new OkResponse({
          data: reelsWithLikes,
          currentPage: page,
          totalPages: Math.ceil(totalReels / limit)
      }));
  } catch (error) {
    console.log("Error while fetching reels",error);
      return next(new BadRequestResponse(error.message));
  }
});


//Get Reel by ID
router.get('/sharedReel', auth.optional, async (req, res, next) => {
  const { reelId, userId } = req.query;
  console.log("Query:", req.query)


  try {
    // Fetch the reel by its ID and populate user details
    const reel = await Reel.findById(reelId).populate('user', 'profileImage fullName followers following followersCount followingsCount');

    if (!reel) {
      return next(new NotFoundResponse('Reel not found'));
    }

    let reelWithLikes = reel.toJSON();

    if (userId != "") {
      reelWithLikes = {
        ...reelWithLikes,
        isLiked: reel.likes.includes(userId.toString()),
        isFollowed: reel.user.followers.includes(userId.toString())
      };
    }

    // Return an OK response with the modified reel data
    return res.json(new OkResponse(reelWithLikes));
  } catch (error) {
    console.error("Error while fetching reel:", error);
    return next(new BadRequestResponse(error.message));
  }
});


//get Reels by Id for own Id or any account id 
router.get('/featured', auth.required, auth.user, async (req, res, next) => {
  const userId = req.query.userId;
  console.log("req user", req.user.email)

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;
  const skip = (page - 1) * limit;

  try {
      const totalReels = await Reel.countDocuments({ user: userId });
      const reels = await Reel.find({ user: userId })
                              .sort({ createdAt: -1 })
                              .skip(skip)
                              .limit(limit).populate('user',  'profileImage fullName followers following ' )
      const reelsWithLikes = reels.map(reel => ({
          ...reel.toJSON(),
          isLiked: reel.likes.includes(req.user._id.toString()),
          isFollowed: reel.user.followers.includes(req.user._id.toString())
      }));

      return next(new OkResponse({
          data: reelsWithLikes,
          currentPage: page,
          totalPages: Math.ceil(totalReels / limit)
      }));
  } catch (error) {
    console.log("Error while fetching reels",error);
      return next(new BadRequestResponse(error.message));
  }
});


// Get reels created by users that the logged-in user is following
router.get('/following-reels', auth.required, auth.user, async (req, res, next) => {
  const userId = req.user._id;
  const followingUsers = req.user.following; 
  console.log("Following users: ", followingUsers)
  console.log("req user", req.user.email)



  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 2;
  const skip = (page - 1) * limit;

  try {
    
      if (!followingUsers.length) {
        return next(new OkResponse({
            data: [],
            currentPage: page,
            totalPages: 0
        }));
      }
      const totalReels = await Reel.countDocuments({ user: { $in: followingUsers } });

      // Fetch the reels from users the logged-in user is following
      const reels = await Reel.find({ user: { $in: followingUsers } })
                              .sort({ createdAt: -1 })
                              .skip(skip)
                              .limit(limit)
                              .populate('user', 'profileImage fullName followers following');

      // Map the reels to add custom properties `isLiked` and `isFollowed`
      const reelsWithLikes = reels.map(reel => ({
          ...reel.toJSON(),
          isLiked: reel.likes.includes(userId),
          isFollowed: reel.user.followers.includes(userId.toString())
      }));

      // Send the response
      return next(new OkResponse({
          data: reelsWithLikes,
          currentPage: page,
          totalPages: Math.ceil(totalReels / limit)
      }));
  } catch (error) {
      console.log("Error while fetching reels", error);
      return next(new BadRequestResponse(error.message));
  }
});


//like or unlike the reel
router.post('/like/:reelId', auth.required, auth.user, async (req, res, next) => {
    try {
      const { reelId } = req.params;
      const  userId  = req.user._id;
  
      const reel = await Reel.findById(reelId);
      if (!reel) {
        return next(new BadRequestResponse("Reel not found"));
      }
  
    
      const userHasLiked = reel.likes.includes(userId);
      
      const update = userHasLiked
        ? { $pull: { likes: userId }, $inc: { likesCount: -1 } }
        : { $addToSet: { likes: userId }, $inc: { likesCount: 1 } };
  
      const updatedReel = await Reel.findByIdAndUpdate(reelId, update, { new: true });
      

  
      return next(new OkResponse({
        message: "Operation Successful",
        likesCount: updatedReel.likesCount,
        isLiked : userHasLiked ? false : true,
        _id: reelId
      }));
    } catch (error) {
      console.log("Error liking reel:", error.message);
      return next(new BadRequestResponse(error.message));
    }
  });


//delete the reel
router.delete('/delete', auth.required, async (req, res, next) => {
  const { reelId } = req.query;

  try {
  
    if (!reelId) {
      return res.status(400).json({ error: 'reelId parameter is required' });
    }

   
    const deletedReel = await Reel.findByIdAndDelete(reelId);

    if (!deletedReel) {
      return next(new NotFoundResponse("Reel Not Found"));
    }

    return next(new OkResponse("Reel deleted successfully"));
  } catch (error) {
    console.log('Failed to delete reel:', error);
    return next(new BadRequestResponse(error.message));
  }
});


//increment share count
router.post('/incrementShareCount/:reelId', async (req, res, next) => {
  try {
    const { reelId } = req.params;
    const reel = await Reel.findByIdAndUpdate(reelId, { $inc: { shareCount: 1 } }, { new: true });
    return next(new OkResponse(reel));
  } catch (error) {
    return next(new BadRequestResponse(error.message));
  }
});



  router.get('/generate-presigned-url',  async  (req, res, next) => {
    const {fileName, fileType} = req.query;
  
    if(!fileType || fileType === "") {
      return next(new BadRequestResponse("File Type is required"));
  }
  
     if(!fileName || fileName === "") {
    return next(new BadRequestResponse("File name is required"));
    }
    
    // const typeCheck = fileType.split("/")[0]
    // if(typeCheck != "video" ){
    //   return next(new BadRequestResponse("Please upload a video file"));
    // }
  

    const key = `uploads/${uuid()}-${fileName}`; 
    const s3Params = {
      Bucket: bucketName,
      Key: key, 
      Expires: 60 * 4,  
      ContentType: `${fileType}`
    };
  
    try {
      const url = await s3.getSignedUrlPromise('putObject', s3Params);
      return next(new OkResponse({ preSignedUrl: url, key: key }));
    } catch (error) {
      console.log("Error generating presigned URL:", error.message);
      return next(new BadRequestResponse(error.message));
    }
  });
  

  // endpoint to start multipart upload
  router.post("/start-multipart-upload", async (req, res) => {
    const {fileName, fileType} = req.query;

    const key = `uploads/${uuid()}-${fileName}`; 
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentDisposition : "inline",
      ContentType : fileType
    };
  
    try {
      const multipart = await s3.createMultipartUpload(params).promise();
      return next(new OkResponse({ uploadId: multipart.UploadId }));
    } catch (error) {
      console.log("Error starting multipart upload:", error);
      return next(new BadRequestResponse(error.message));
    }
  });
  

  // Generate presigned url for each multiparts
  router.post("/generate-presigned-url", async (req, res) => {
    const { key, uploadId, partNumbers } = req.body;
    const totalParts = Array.from({ length: partNumbers }, (_, i) => i + 1);
    try {
      const presignedUrls = await Promise.all(
        totalParts.map(async (partNumber) => {
          const params = {
            Bucket: bucketName,
            Key: key,
            PartNumber: partNumber,
            UploadId: uploadId,
            Expires: 3600 * 3,
          };
  
          return s3.getSignedUrl("uploadPart", {
            ...params,
          });
        })
      );
      return next(new OkResponse({ presignedUrls }));
    } catch (error) {
      console.log("Error generating pre-signed URLs:", error);
      return next(new BadRequestResponse(error.message));
    }
  });
  
  // Complete multipart upload
  router.post("/complete-multipart-upload", async (req, res) => {
  
    let key = req.body.key;
    let uploadId = req.body.uploadId;
    let parts = req.body.parts;
  
    const params = {
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
  
      MultipartUpload: {
        Parts: parts.map((part, index) => ({
          ETag: part.etag,
          PartNumber: index + 1,
        })),
      },
    };
    try {
      const data = await s3.completeMultipartUpload(params).promise();
      return next(new OkResponse({ fileData: data }));
    } catch (error) {
      console.log("Error completing multipart upload:", error);
      return next(new BadRequestResponse(error.message));
    }
  });
  

module.exports = router;
