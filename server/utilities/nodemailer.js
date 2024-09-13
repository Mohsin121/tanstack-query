const nodemailer = require("nodemailer");
const {
	emailVerifyTemplate,
	forgetEmailTemplate,
	profileActiveTemplate,
	profileBlockTemplate,
	profileDeletedTemplate,
	profileRejectionTemplate,
	forgetPasswordOtpTemplate,

} = require("../emailTemplates/authTemplates");
const { smtpAuth } = require("../config/env/development");




const setTransporter = () => {
	
	return nodemailer.createTransport({
		host: "smtp.gmail.com",
		port: 465,
		secure: true,
		auth: smtpAuth ,
	});
};
console.log("smpt auth", smtpAuth)


const selectTemplate = (user, body, template) => {
	if (body.verifyEmail) template = emailVerifyTemplate(user);
	else if (body.forgetEmail) template = forgetEmailTemplate(user);
	else if (body.forgetPassword) template = forgetPasswordOtpTemplate(user);
	else if (body.deleteAccount) template = profileDeletedTemplate(user);
	else if (body.reminder) template = emailReminderTemplate(user);  // New condition for reminders

	else if (body.status) {
		if (body.status == "active") template = profileActiveTemplate(user, body);
		else if (body.status == "rejected") template = profileRejectionTemplate(user, body);
		else if (body.status == "inactive") template = profileBlockTemplate(user, body);
		else {
		}
	} else console.log("Body Not Valid", body);

	return template;
};

const setMessage = (user, subject, template) => {
	return {
		to: user.email,
		from: "GreyVen<support@GreyVen>",
		subject,
		html: template,
	};
};


exports.sendEmail = (user, subject, body) => {
	const transporter = setTransporter();

	let template = "";
	template = selectTemplate(user, body, template);
	const msg = setMessage(user, subject, template);

	transporter.sendMail(msg, (err, info) => {
		if (err) console.log(err);
		else console.log("Email sent", info);
	});
};


exports.sendEmailReminder = async (user, subject, message) => {
	const template = emailReminderTemplate(message);
 	const transporter = setTransporter();

	const mailOptions = {
			from: "GreyVen<support@GreyVen>",
			to: user.email,
			subject: subject,
			html: template  
	};

	try {
			const info = await transporter.sendMail(mailOptions);
			console.log("Email sent successfully:", info);
	} catch (error) {
			console.error("Failed to send email:", error);
	}
};

