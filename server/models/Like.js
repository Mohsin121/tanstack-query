var mongoose = require("mongoose");


const LikeSchema = new mongoose.Schema({
  reel: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

LikeSchema.index({ reel: 1, user: 1 }, { unique: true });


LikeSchema.methods.toJSON = function () {
	return {
		_id: this._id,
		reel: this.reel,
		user: this.user,
	};
};

module.exports = mongoose.model("Like", LikeSchema);
