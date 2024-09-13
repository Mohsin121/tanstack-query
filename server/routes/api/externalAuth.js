let router = require("express").Router();
let { OkResponse, BadRequestResponse } = require("express-http-response");
let User = require("../../models/User");



// router.post("/signup/social", async (req, res, next) => {
// 	let { firstName, lastName, email, accountType, profileImage, socialID, role } = req.body;
// 	if (!firstName || !lastName || !email || !accountType || !role) {
// 		return next(new BadRequestResponse("Missing required fields"));
// 	}

// 	let exitingUser = await User.findOne({ socialID });

// 	if (exitingUser && exitingUser.role !== role)
// 		return next(new BadRequestResponse("Invalid profile role selected", 423));

// 	if (exitingUser?.status === "inactive") return next(new UnauthorizedResponse("Your account is inactive", 402));
// 	if (exitingUser) {
// 		return next(new OkResponse({ user: exitingUser.toAuthJSON() }));
// 	}

// 	let user = new User({
// 		fullName: firstName + " " + lastName,
// 		email,
// 		accountType,
// 		status: role == "patient" ? "active" : "pending",
// 		profileImage,
// 		socialID: socialID,
// 		profileCompletionStatus: 2,
// 		role: role,
// 	});

// 	user
// 		.save()
// 		.then(async () => {
// 			return next(new OkResponse({ user: user.toAuthJSON() }));
// 		})
// 		.catch((e) => {
// 			return next(new BadRequestResponse(e));
// 		});
// });


module.exports = router;
