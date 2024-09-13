let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
let mongoose = require("mongoose");
let User = mongoose.model("User");

passport.use(
	new LocalStrategy(
		{
			// passReqToCallback: true,
			usernameField: "user[email]",
			passwordField: "user[password]",
		},
		 (email, password, done) => {
			User.findOne({
				email: { $regex: new RegExp("^" + email + "$", "i") },
			})
				.then( (user) => {

					if ( user?.accountType === "google") {
						return done(null, false, { error: "You have signed in with Google. Please log in with Google." });
					}
	
					if ( user?.accountType === "apple") {
						return done(null, false, { error: "You have signed in with Apple. Please log in with Apple." });
					}
					
					if (!user) {
						return done(null, false, { error: "Either incorrect username/password or user does not exist." });
					}

					if (!user.validPassword(password)) {
						return done(null, false, { error: "Incorrect Password" });
					}
					return done(null, user);
				})
				.catch(done);
		}
	)
);
