let Notification = require("../models/Notification");
let User = require("../models/User");

exports.sendNotification = async (title, description, type, sentTo, sentBy, data) => {
	greyVenSocket.emit("notify-" + sentTo);
	try {
		await new Notification({
			title: title,
			description: description,
			type: type,
			sentTo: sentTo,
			sentBy: sentBy,
			data: data,
		}).save();
	} catch (error) {
		console.log("Error in sendNotification", error);
	}
};
