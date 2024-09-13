let mongoose = require("mongoose");
let router = require("express").Router();

let ChatGroup = mongoose.model("ChatGroup");

let auth = require("../auth");

let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require("express-http-response");




const getUserByEmail = async (req, res, next, email) => {
	try {
		const userToUpdate = await User.findOne({ email });
		if (!userToUpdate) {
			return next(new BadRequestResponse("User not found!", 423));
		}
		req.userToUpdate = userToUpdate;
		next();
	} catch (error) {
		return next(new BadRequestResponse(error));
	}
};

const getChatGroupBySlug = async (req, res, next, slug) => {
	try {
		const chatGroup = await ChatGroup.findOne({ slug });
		if (!chatGroup) {
			return next(new BadRequestResponse("ChatGroup not found!", 423));
		}
		req.chatGroup = chatGroup;
		next();
	} catch (error) {
		return next(new BadRequestResponse(error));
	}
};

const getChatGroupById = async (req, res, next, _id) => {
	try {
		const chatGroup = await ChatGroup.findOne({ _id });
		if (!chatGroup) {
			return next(new BadRequestResponse("ChatGroup not found!", 423));
		}
		req.chatGroup = chatGroup;
		next();
	} catch (error) {
		return next(new BadRequestResponse(error));
	}
};


router.param("email", getUserByEmail);
router.param("chatGroupSlug", getChatGroupBySlug);
router.param("chatGroupId", getChatGroupById);

router.post("/create", async (req, res, next) => {
  try {
      const { senderId, receiverId } = req.body;

      if (!senderId || !receiverId) {
          return next(new BadRequestResponse("Sender ID and Receiver ID are required.", 422));
      }
     
      let query = {
          users: { $all: [senderId, receiverId] }
      };

      let chatGroup = await ChatGroup.findOne(query);

      if (!chatGroup) {
          chatGroup = new ChatGroup({
              users: [senderId, receiverId],
          });

          chatGroup = await chatGroup.save();
      }

      return next(new OkResponse(chatGroup));
  } catch (error) {
      return next(new BadRequestResponse(error.message || 'An error occurred', 500));
  }
});

// Get all chat groups by user
router.get("/allChats/:userId", async (req, res, next) => {
	try {
		let query = {
			users: { $in: [req.params.userId]} ,
		};

		const options = {
			sort: {
				updatedAt: -1,
			},
		};

		const chatGroups = await ChatGroup.find(query, null, options).populate("lastMessage", "text").populate("users", "fullName profileImage" );
		return next(new OkResponse(chatGroups));
	} catch (error) {
		return next(new BadRequestResponse(error));
	}
});



router.get("/all-chat-groups", auth.required, auth.user, async (req, res, next) => {
	try {
		let query = {
			$or: [{ patient: req.user._id }, { doctor: req.user._id }],
		};

		const options = {
			sort: {
				updatedAt: -1,
			},
		};

		const chatGroups = await ChatGroup.find(query, null, options);
		return next(new OkResponse(chatGroups));
	} catch (error) {
		return next(new BadRequestResponse(error));
	}
});


module.exports = router;