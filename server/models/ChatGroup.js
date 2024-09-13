const { text } = require("body-parser");
var mongoose = require("mongoose");


var ChatGroupSchema = new mongoose.Schema(
	{
		lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
		users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    text:{type: String, default:"" , trim: true}, 
    createdAt: { type: Date, default: Date.now },

	},
	{ timestamps: true }
);



ChatGroupSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    lastMessage:this.lastMessage,
    createdAt: this.createdAt,
    users: this.users,
  };
};




module.exports = mongoose.model("ChatGroup", ChatGroupSchema);










