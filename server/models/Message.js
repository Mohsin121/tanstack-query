var mongoose = require("mongoose");

var MessageSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chatGroup: { type: mongoose.Schema.Types.ObjectId, ref: "ChatGroup" },
    attachment: { type: String, default: "" },
  },
  { timestamps: true }
);

MessageSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    sender: this.sender,
    receiver: this.receiver,
    chatGroup: this.chatGroup,
    text: this.text,
    attachment: this.attachment,
    createdAt: this.createdAt,

    // updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model("Message", MessageSchema);
