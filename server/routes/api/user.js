let mongoose = require("mongoose");
let router = require("express").Router();
let passport = require("passport");
let User = mongoose.model("User");
let auth = require("../auth");
let { OkResponse, BadRequestResponse, UnauthorizedResponse, NotFoundResponse } = require("express-http-response");
let { sendEmail } = require("../../utilities/nodemailer");
const { backend } = require("../../config");

//get user from email address
router.param("email", (req, res, next, email) => {
	User.findOne({ email }, (err, user) => {
		if (err) return next(new BadRequestResponse(err));
		if (!user) return next(new BadRequestResponse("User not found!", 423));
		req.userToUpdate = user;
		return next();
	});
});

router.param("_id", (req, res, next, _id) => {
	console.log("type of id", typeof _id)
	User.findById(_id, (err, user) => {
		console.log("Hits", user)
		if (err) return next(new BadRequestResponse(err));
		if (!user) return next(new BadRequestResponse("User not found!", 423));
		req.userToUpdate = user;
		return next();
	});
});


router.get("/context", auth.required, auth.user, (req, res, next) => {
	return next(new OkResponse(req.user.toAuthJSON()));
});


router.post("/signup/social", async (req, res, next) => {
	let { firstName, lastName, email, accountType, profileImage, socialID } = req.body.user;

	console.log("body signup", req.body.user)
	if (!firstName || !lastName || !email || !accountType ) {
		return next(new BadRequestResponse("Missing required fields"));
	}

	let exitingUser = await User.findOne({ socialID });
	// if (!exitingUser)
	// 	return next(new BadRequestResponse("User Already exists", 423));

	if (exitingUser?.status === "inactive") return next(new UnauthorizedResponse("Your account is inactive", 402));
	if (exitingUser) {
		return next(new OkResponse({ user: exitingUser.toAuthJSON() }));
	}

	let user = new User({
		fullName: firstName + " " + lastName,
		email,
		accountType,
		status:"active",
		profileImage,
		socialID: socialID,
		isEmailVerified: true,
	});
	user
		.save()
		.then(async () => {
			return next(new OkResponse({ user: user.toAuthJSON() }));
		})
		.catch((e) => {
			return next(new BadRequestResponse(e));
		});

	
});

router.post("/login", (req, res, next) => {
	passport.authenticate("local", { session: false }, function (err, user, info) {
		

		if (err) return next(new BadRequestResponse(err.message));
		if (info) return next(new BadRequestResponse(info?.error));
		// if (!user) return next(new BadRequestResponse(`Either incorrect username/password or user does not exist.`, 423));	
		if (!user.isEmailVerified) return next(new BadRequestResponse("Your email has been not verified", 403));
		if (user.status === "inactive") return next(new UnauthorizedResponse("Your account is inactive", 402));
		return next(new OkResponse({ user: user.toAuthJSON()}));
	})(req, res, next);

});

router.post("/signup", (req, res, next) => {
	User.findOne({ email: req.body.email }, (err, res) => {
		if (err) return next(new BadRequestResponse(err));
		if (res) return next(new BadRequestResponse("User already exists", 423));

		let user = new User();
		user.fullName = req.body.firstName + " " + req.body.lastName;
		user.email = req.body.email;
		user.setPassword(req.body.password);
		user.generateMailToken();
		user.setOTP();
		user.save((err, res) => {
			if (err) return next(new BadRequestResponse(err));
			sendEmail(user, "Verify Email", { verifyEmail: true });
			return next(new OkResponse({ user: user.toAuthJSON() }));
		});
	});
});

router.post("/otp/verify/:email/:verificationType", (req, res, next) => {

	console.log("Req params ", req.params)

	const { otp } = req.body
	if (!otp) {
		return next(new BadRequestResponse("Missing required parameter", 422));
	}

	let query = {
		email: req.userToUpdate.email,
		otp: otp,
		otpExpires: { $gt: Date.now() },
	};

	User.findOne(query, function (err, user) {
		if (err) return next(new UnauthorizedResponse(err));
		if (!user) return next(new UnauthorizedResponse("OTP is invalid or has expired", 422));
		user.otp = null;
		
		if (req.params.verificationType === "registration") {
			user.isEmailVerified = true;
			user.status = "active";
			user.otpExpires = null;
		} else {
			user.generatePasswordRestToken();
		}

		user.save().then(function () {
			if (req.params.verificationType === "registration") {
				return next(new OkResponse(user.toAuthJSON()));
			} else if (req.params.verificationType === "resetPassword") {
				return next(new OkResponse({ resetPasswordToken: user.resetPasswordToken }));
			}
		});
	});
});


router.post("/otp/resend/:email", async (req, res, next) => {
	req.userToUpdate.otp = null;
	req.userToUpdate.isOtpVerified = false;

	req.userToUpdate.setOTP();

	req.userToUpdate.save((err, result) => {
		if (!!err) return next(new BadRequestResponse(err));
		sendEmail(req.userToUpdate, "Email Verification", { verifyEmail: true });
		return next(new OkResponse(result));
	});
});

router.post("/forgot-password", function (req, res, next) {
	if (!req.body.email) return next(new BadRequestResponse("Missing required parameter.", 422.0));

	User.findOne({ email: req.body.email }, (err, user) => {
		if (err) return next(new BadRequestResponse(err));
		if (!user) return next(new BadRequestResponse("User does not exist.", 422.0));
		if( user && user.accountType ==="apple" || user.accountType ==="google")  return next(new BadRequestResponse(`You cannot change password. You have login with the ${user.accountType} account.`, 422.0));
		user.setOTP()
		
		user.otpExpires = Date.now() + 1800000; // 30 mins
		
		user.save((err, user) => {
			if (err) return next(new BadRequestResponse(err));
			// sendEmail(user, "Forgot Email", { forgetEmail: true });
			sendEmail(user, "Forgot Password", { forgetPassword: true });

			return next(new OkResponse({ message: "Otp sent successfully" }));
		});
	});
});



router.post("/set-new-password/:email/:resetPasswordToken", (req, res, next) => {
	if (
		req.userToUpdate.resetPasswordToken === req.params.resetPasswordToken &&
		req.userToUpdate.otpExpires > Date.now()
	) {
		if (!req.body.password || req.body.password == "")
			return next(new BadRequestResponse("Missing Required Parameters", 422));
		req.userToUpdate.setPassword(req.body.password);
		req.userToUpdate.otpExpires = null;
		req.userToUpdate.resetPasswordToken = null;
		req.userToUpdate.mailToken = null;

		req.userToUpdate.save(function (err) {
			if (err) return next(new BadRequestResponse(err));
			
			return next(new OkResponse({ message: "Password has been changed successfully", role: req.userToUpdate.role }));
		});
	} else return next(new BadRequestResponse("Invalid OTP"));
});

router.put("/update-password", auth.required, auth.user, (req, res, next) => {
	if (!req.body.oldPassword || !req.body.password)
		return next(new BadRequestResponse("Missing Required Parameters", 422));

	if (req.body.oldPassword.length <= 0 || req.body.password.length <= 0)
		return next(new BadRequestResponse("Missing Required Parameters", 422));

	if (req.body.oldPassword === req.body.password)
		return next(new BadRequestResponse("Old password and new password cannot be same", 422));

	if (req.user.validPassword(req.body.oldPassword)) {
		req.user.setPassword(req.body.password);
		req.user.save(function (err) {
			if (err) return next(new BadRequestResponse(err));
			return next(new OkResponse({ message: "Password has been changed successfully" }));
		});
	} else return next(new BadRequestResponse("Invalid Old Password!!", 422));
});

router.put("/profile", auth.required, auth.user, (req, res, next) => {
	if (!req.body) return next(new BadRequestResponse("Missing required parameter.", 422.0));

	req.user.email = req.body.email || req.user.email;
	req.user.profileImage = req.body.profileImage || req.user.profileImage;

	req.user.save((err, data) => {
		if (err) return next(new BadRequestResponse(err));
		return next(new OkResponse(data));
	});
});



// Function to handle a new follower

router.post('/follow', auth.required, async (req, res, next) => {
  const { followerId, userId, action } = req.body;

	console.log("req body", req.body)

  if (!followerId) {
    return next(new BadRequestResponse("Follower Id missing"));
  }

  if (!userId) {
    return next(new BadRequestResponse("User Id missing"));
  }

  if (!action || (action !== 'follow' && action !== 'unfollow')) {
    return next(new BadRequestResponse("Action must be 'follow' or 'unfollow'"));
  }

  try {
    const userToFollow = await User.findById(userId);
    if (!userToFollow) {
      return next(new NotFoundResponse("User not found"));
    }

    const follower = await User.findById(followerId);
    if (!follower) {
      return next(new NotFoundResponse("Follower not found"));
    }

    if (action === 'follow') {
      if (follower.following.includes(userId)) {
        return next(new BadRequestResponse("Already following this user"));
      }

      await User.findByIdAndUpdate(userId, { $addToSet: { followers: followerId }, $inc: { followersCount: 1 } });
      await User.findByIdAndUpdate(followerId, { $addToSet: { following: userId }, $inc: { followingsCount: 1 } });
      return next(new OkResponse({message: "Follow success", isFollowed : true}));
    } else if (action === 'unfollow') {
      if (!follower.following.includes(userId)) {
        return next(new BadRequestResponse("Not following this user"));
      }

      await User.findByIdAndUpdate(userId, { $pull: { followers: followerId }, $inc: { followersCount: -1 } });
      await User.findByIdAndUpdate(followerId, { $pull: { following: userId }, $inc: { followingsCount: -1 } });
      return next(new OkResponse({message: "Follow success", isFollowed : false}));
    }
  } catch (error) {
    console.error('Error processing follow/unfollow:', error);
    return next(new BadRequestResponse(error.message));
  }
});




// router.post('/follow', auth.required, async (req, res, next) => {

// 	const {followerId, userId} = req.body;

//   if (!followerId) {
//     return next(new BadRequestResponse("Follower Id missing"));
//   }

// 	if(!userId){
// 		return next(new BadRequestResponse("User to follow Id missing"));

// 	}

//   try {


// 		const userTofollow = await User.findById(userId);
//     if (!userTofollow) {
// 			return next(new NotFoundResponse("User to follow not found"));
// 		}

    
//     const follower = await User.findById(followerId);
//     if (!follower) {
// 			return next(new NotFoundResponse("Follower user not found"));
//     }

//     if (follower.following.includes(userId)) {
// 			return next(new BadRequestResponse("Already following this user"));
//     }

//     await User.findByIdAndUpdate(userId, { $push: { followers: followerId }, $inc: { followersCount: 1 } });
//     await User.findByIdAndUpdate(followerId, { $push: { following: userId }, $inc: { followingsCount: 1 } });
//     return next(new OkResponse("Follow success"));
//   } catch (error) {
//     console.error('Error following user:', error);
//     return next(new BadRequestResponse(err.message));
//   }
// });

// // Unfollow API
// router.post('/unfollow', auth.required, async (req, res, next) => {

//   const {followerId, userId} = req.body;

//   if (!followerId) {
//     return next(new BadRequestResponse("Follower Id missing"));
//   }

//   try {
//     const userToUnfollow = await User.findById(userId);
//     if (!userToUnfollow) {
// 			return next(new NotFoundResponse("User to unfollow not found"));

//     }

//     const follower = await User.findById(followerId);
//     if (!follower) {
// 			return next(new NotFoundResponse("Follower not found"));

//     }

//     if (!follower.following.includes(userId)) {
// 			return next(new BadRequestResponse("Not following this user"));
//     }

//     await User.findByIdAndUpdate(userId, { $pull: { followers: followerId }, $inc: { followersCount: -1 } });
//     await User.findByIdAndUpdate(followerId, { $pull: { following: userId }, $inc: { followingsCount: -1 } });
// 		return next(new OkResponse("Un Follow success "));
//   } catch (error) {
//     console.error('Error unfollowing user:', error);
//     return next(new BadRequestResponse(err.message));
//   }
// });


module.exports = router;
