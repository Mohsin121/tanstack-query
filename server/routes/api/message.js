let mongoose = require("mongoose");
let router = require("express").Router();
let ChatGroup = mongoose.model("ChatGroup");
let auth = require("../auth");

let { OkResponse, BadRequestResponse } = require("express-http-response");
const { emitEvent } = require("../../utilities/realTime");
const Message = require("../../models/Message");

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

// Create a new message
router.post("/send", async (req, res, next) => {
  try {
    if (!req.body) {
      return next(new BadRequestResponse("Missing required parameter.", 422));
    }

    const { chatId, sender, message, receiver, attachment } = req.body;

    const newMessage = new Message({
      chatGroup: chatId,
      sender: sender,
      text: message,
      receiver: receiver,
      attachment: attachment,
    });

    const messageDoc = await newMessage.save();

    const chat = await ChatGroup.findOne({ _id: chatId });
    chat.lastMessage = messageDoc._id;
    await chat.save();

    emitEvent(`${receiver}-new-message`, messageDoc);

    return next(new OkResponse(messageDoc));
  } catch (error) {
    return next(new BadRequestResponse(error));
  }
});

// Get messages by chatGroup ID
router.get("/:chatGroupId", async (req, res, next) => {
  try {
    const { chatGroupId } = req.params;

    const messages = await Message.find({ chatGroup: chatGroupId });
    return next(new OkResponse(messages));
  } catch (error) {
    return next(new BadRequestResponse(error));
  }
});

router.get("/random", auth.required, auth.user, async (req, res, next) => {
  try {
    let query = { receiver: req.user._id };

    const options = {
      limit: 10,
      sort: {
        createdAt: -1,
      },
    };

    const messages = await Message.find(query, null, options);
    return next(new OkResponse(messages));
  } catch (error) {
    return next(new BadRequestResponse(error));
  }
});

module.exports = router;
