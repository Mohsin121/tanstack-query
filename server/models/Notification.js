var mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

var NotificationSchema = new mongoose.Schema(
	{
		title: String,
		description: String,
		type: {
			type: String,
			enum: ["system", "trade", "tournament", "lobby", "p2p"],
			required: true,
		},

		sentBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		sentTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},

		isRead: {
			type: Boolean,
			default: false,
		},

		data: {},
	},
	{ timestamps: true }
);

NotificationSchema.plugin(mongoosePaginate);

var autoPopulate = function (next) {
	this.populate("sentBy");
	this.populate("sentTo");
	next();
};

NotificationSchema.pre("findOne", autoPopulate);
NotificationSchema.pre("find", autoPopulate);

NotificationSchema.methods.toJSON = function () {
	return {
		_id: this._id,
		title: this.title,
		description: this.description,
		type: this.type,
		sentBy: this.sentBy,
		sentTo: this.sentTo,
		isRead: this.isRead,
		data: this.data,
		createdAt: this.createdAt,
	};
};

module.exports = mongoose.model("Notification", NotificationSchema);
