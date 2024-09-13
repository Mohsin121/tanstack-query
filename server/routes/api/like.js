let mongoose = require("mongoose");
let router = require("express").Router();
let Reel = mongoose.model("Reel");
let Like = mongoose.model("Like");

let auth = require("../auth");

let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require("express-http-response");

// router.post('/:reelId', auth.required, auth.user, async (req, res, next) => {
//   try {

//     console.log("hitss like api")
//     const { reelId } = req.params;
//     const userId = req.user._id;

//     const reel = await Reel.findById(reelId);
//     if (!reel) {
//       return next(new NotFoundResponse("Reel not found"));
//     }

//     const existingLike = await Like.findOne({ reel: reelId, user: userId });

//     if (existingLike) {
//       // Unlike the reel
//       await Like.findByIdAndDelete(existingLike._id);
//       reel.likesCount -= 1;
//       await reel.save();
//       return next(new OkResponse({ message: "Unliked successfully", likesCount: reel.likesCount }));
//     } else {
//       // Like the reel
//       const like = new Like({
//         reel: reelId,
//         user: userId
//       });

//       await like.save();
//       reel.likesCount += 1;
//       await reel.save();
//       return next(new OkResponse({ message: "Liked successfully", likesCount: reel.likesCount }));
//     }
//   } catch (error) {
//     console.error("Error liking/unliking reel:", error.message);
//     return next(new BadRequestResponse(error.message));
//   }
// });



router.post('/:reelId', auth.required, auth.user, async (req, res, next) => {
  try {
    const { reelId } = req.params;
    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return next(new NotFoundResponse("Reel not found"));
    }

    const existingLike = await Like.findOne({ reel: reelId, user: userId });

    if (existingLike) {
      // Unlike the reel
      await Like.findByIdAndDelete(existingLike._id);
      reel.likesCount -= 1;
      reel.likes.pull(userId); // Remove user from likes array
      await reel.save();
      return next(new OkResponse({ message: "Unliked successfully", likesCount: reel.likesCount,  isLiked: false }));
    } else {
      // Like the reel
      const like = new Like({
        reel: reelId,
        user: userId
      });

      await like.save();
      reel.likesCount += 1;
      reel.likes.push(userId); // Add user to likes array
      await reel.save();
      return next(new OkResponse({ message: "Liked successfully", likesCount: reel.likesCount, isLiked: true}));
    }
  } catch (error) {
    console.error("Error liking/unliking reel:", error.message);
    return next(new BadRequestResponse(error.message));
  }
});



module.exports = router;