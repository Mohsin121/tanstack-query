var mongoose = require("mongoose");

var ReelSchema = new mongoose.Schema(
	{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    description: { type: String, default: '' },

    videoUrl: {
      type: String,
      required: true,
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    likesCount: {
      type: Number,
      default: 0,
    },

    shareCount: {
      type: Number,
      default: 0,
    },

    // comments: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Comment',
    //   },
    // ],

    commentsCount: {
      type: Number,
      default: 0,
    },

    createdAt: { type: Date, default: Date.now }

	},
	{ timestamps: true }
);



ReelSchema.methods.toJSON = function () {
	return {
		_id: this._id,
		description: this.description,
		videoUrl: this.videoUrl,
    likesCount: this.likesCount,
    commentsCount: this.commentsCount,
    shareCount:this.shareCount,
    // likes:this.likes,
    user: this.user,
		createdAt: this.createdAt,
	};
};

ReelSchema.methods.toComments = function () {
	return {
		_id: this._id,
		comments: this.comments
	};
};

module.exports = mongoose.model("Reel", ReelSchema);
