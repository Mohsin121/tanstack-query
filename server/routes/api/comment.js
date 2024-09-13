const express = require("express");
const router = express.Router();
const Reel = require("../../models/Reel");
const User = require("../../models/User");

const Comment = require("../../models/Comment");
let auth = require("../auth");

let { OkResponse, BadRequestResponse, UnauthorizedResponse, NotFoundResponse } = require("express-http-response");


// Add a comment to a reel
router.post('/:reelId', auth.required, auth.user, async (req, res, next) => {
  try {
    const { reelId } = req.params;
    const {  text } = req.body;

    const userId = req.user._id;

    const reel = await Reel.findById(reelId);
    if (!reel) {
      return next (new BadRequestResponse("Reel not found" ));
    }

    
    const comment = new Comment({
      createdBy: userId,
      reel: reelId,
      text,
    });
    
    
    await comment.save();
    
    reel.commentsCount++;
    // reel.comments.push(comment._id);
    await reel.save();

    return next(new OkResponse({ message: "Comment added successfully", comment }));
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Error adding comment", error: error.message });
  }
});



router.get('/:reelId', auth.required, async (req, res, next) => {
  try {
    const { reelId } = req.params;

    
    const comments = await Comment.find({ reel: reelId, parentId: null })
      .populate('createdBy', '-_id fullName profileImage');
    
      return next(new OkResponse(comments));

  } catch (error) {
    console.error("Error fetching comments:", error.message);
    return next(new BadRequestResponse(error.message));
  }
});





router.post('/reply/:commentId', auth.required, auth.user, async (req, res, next) => {
  try {
    const { commentId } = req.params;
    const { text, replyToId } = req.body;
    const userId = req.user._id;

    const parentComment = await Comment.findById(commentId).populate('createdBy', 'fullName');

    if (!parentComment) {
      return next(new NotFoundResponse("Comment not found"));
    }

    parentComment.replyCount++;

    const comment = new Comment({
      createdBy: userId,
      reel: parentComment.reel,
      parentId: parentComment._id,
      text,
    });
    if(replyToId){
      comment.replyTo = replyToId;
    }

    await parentComment.save();
    await comment.save();

    return next(new OkResponse({
      message: "Reply added successfully",
      reply: comment
    }));
  } catch (error) {
    console.error("Error adding reply:", error.message);
    return next(new BadRequestResponse(error.message));
  }
});



router.get('/replies/:commentId', auth.required, async (req, res, next) => {
  try {
    const { commentId } = req.params;

    let replies = await Comment.find({ parentId: commentId })
      .populate('createdBy', 'fullName profileImage')
      .populate('replyTo', 'fullName')

      // .populate({
      //   path: 'parentId',
      //   populate: {
      //     path: 'createdBy',
      //     select: 'fullName'
      //   }
      // });
      replies = replies.map(reply => {
        if (reply.replyTo && reply.replyTo.fullName) {
          reply.replyTo.fullName = reply.replyTo.fullName.replace(/\s+/g, '').toLowerCase();
        }
        return reply;
      });
  
    return next(new OkResponse(replies));
  } catch (error) {
    console.error("Error fetching replies:", error.message);
    return next(new BadRequestResponse(error.message));
  }
});








router.get('/like/:commentId', auth.required, async (req, res, next) => {
  try {

    
    const { commentId } = req.params;

    const comment = await Comment.findOne({ _id : commentId })

    comment.likesCount++;
    const updatedComment= await Comment.save();

    return next(new OkResponse({likesCount : updatedComment.likesCount}));

  } catch (error) {
    console.error("Error fetching replies:", error.message);
    return next(new BadRequestResponse(error.message));
  }
});









// Update a comment
// router.put('/:commentId', async (req, res, next) => {
//   try {
//     const { commentId } = req.params;
//     const { text } = req.body;

//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return next (new NotFoundResponse("Comment not found" ));
//     }

//     comment.text = text;
//     await comment.save();
//     return next (new OkResponse({ message: "Comment updated successfully", comment } ));


//   } catch (error) {
//     console.error("Error updating comment:", error.message);
//     return next(new BadRequestResponse(error.message));
//   }
// });



// Delete a comment or reply
// router.delete('/:commentId', async (req, res, next) => {
//   try {
//     const { commentId } = req.params;

//     const comment = await Comment.findById(commentId);
//     if (!comment) {
//       return next (new NotFoundResponse("Comment not found" ));
//     }

//     await Comment.findByIdAndDelete(commentId);
//     await Reel.findByIdAndUpdate(comment.reel, { $pull: { comments: commentId } });

//     return next (new OkResponse("Comment deleted successfully" ));
//   } catch (error) {
//     console.error("Error deleting comment:", error.message);
//     return next(new BadRequestResponse(error.message));
//   }
// });




module.exports = router;


