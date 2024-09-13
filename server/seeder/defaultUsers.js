const User = require("../models/User");

const defaultUsers = async () => {
	// Seed Admin
	{
		let admin = new User();
		admin.role = "admin";
		admin.email = "admin@gmail.com";
		admin.setPassword("1234");
		admin.isEmailVerified = true;
		admin.status = "active";

		await admin.save();
	}
	// user
	{
		let user = new User();
		user.email = "user@gmail.com";
		user.setPassword("1234");
		user.isEmailVerified = true;
		user.status = "active";

		await user.save();
	}
	console.log("Default Users Seeded");
};
module.exports = defaultUsers;
