let mongoose = require("mongoose");
let router = require("express").Router();
let User = mongoose.model("User");
let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require("express-http-response");
let { frontend, backend } = require("../../config");

//get user from email address
router.param("email", (req, res, next, email) => {
	User.findOne({ email }, (err, user) => {
		if (err) return next(new BadRequestResponse(err));
		if (!user) return next(new BadRequestResponse("User not found!", 423));
		req.userToUpdate = user;
		return next();
	});
});

// verify Email
router.get("/email/:email/:mailToken", (req, res, next) => {
	let user = req.userToUpdate;
	if (user.mailToken === req.params.mailToken) {
		user.isEmailVerified = true;
		user.mailToken = null;

		user.save((err, data) => {
			if (err) return next(new BadRequestResponse(err));
			res.redirect(frontend + "/auth/reset-password" + "?emailVerified=true");
		});
	} else {
		res.redirect(frontend + "/auth" + "?err=true");
	}
});

//verify forget email
router.get("/forgot/:email/:resetPasswordToken", (req, res, next) => {
	if (
		req.userToUpdate.resetPasswordToken === req.params.resetPasswordToken &&
		req.userToUpdate.otpExpires > Date.now()
	) {
		req.userToUpdate.resetPasswordToken = null;
		req.userToUpdate.otpExpires = null;

		req.userToUpdate.generatePasswordRestToken();
		req.userToUpdate.otpExpires = Date.now() + 1800000; // 30 mins
		req.userToUpdate.isEmailVerified = true;

		req.userToUpdate.save((err, user) => {
			if (err) return next(new BadRequestResponse(err));
			if (!user) return next(new BadRequestResponse("User not found", 422));
			res.redirect(`${frontend}/auth/reset-password/${user._id}/${user.resetPasswordToken}`);
		});
	} else {
		res.redirect(frontend + "/auth" + "?err=true");
	}
});

// verify New User
router.get("/user/:email/:mailToken", (req, res, next) => {
	let user = req.userToUpdate;
	if (user.mailToken === req.params.mailToken) {
		user.isEmailVerified = true;
		user.mailToken = null;
		user.save((err, data) => {
			if (err) return next(new BadRequestResponse(err));
			res.redirect(frontend + "/auth/reset/" + user.email + "?newUser=true");
		});
	} else {
		return next(new BadRequestResponse("Invalid OTP"));
	}
});

module.exports = router;
