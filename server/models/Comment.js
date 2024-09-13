var mongoose = require("mongoose");


var CommentSchema = new mongoose.Schema(
	{
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reel',
      // required: true,
    },
    text: {   //
      type: String,
      required: true,
    },

    parentId :{ 
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',   
      default: null,
    },

    replyCount :{ type : Number, default: 0},

    likeCount :{ type : Number, default: 0},

    replyTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User',
      default: null,
    },

   
    createdAt: { type: Date, default: Date.now },

	},
	{ timestamps: true }
);


CommentSchema.methods.toJSON = function () {
  return {
    _id: this._id,
    createdBy: this.createdBy,
    text: this.text,
    replyCount: this.replyCount,
    replyTo: this.replyTo,
    // createdAt: this.createdAt,
    parentId:this.parentId,
    // updatedAt: this.updatedAt,
  };
};



CommentSchema.methods.toReplyJSON = function () {
  return {
    _id: this._id,
    createdBy: this.createdBy,
    text: this.text,
    parentId:this.parentId,

  };
};


module.exports = mongoose.model("Comment", CommentSchema);
