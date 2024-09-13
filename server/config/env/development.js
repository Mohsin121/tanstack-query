"use strict";
module.exports = {
  MONGODB_URI: "mongodb://127.0.0.1/GreyVen",
  secret: "secret",
  PORT: 8000,
  host: "",

  smtpAuth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // smtpAuth: {
  // 	user: "info@verited.com",
  // 	pass: "mrdqvhxabnllgghj",
  // },

  allowedOrigins: [
    "http://localhost:5000",
    "http://localhost:8000",
    "http://localhost:3000",
    "http://34.239.106.12",
    "http://localhost:5173",
  ],

  backend:
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000"
      : "http://34.239.106.12",
  frontend:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "http://34.239.106.12",
  publicPics:
    process.env.NODE_ENV === "development"
      ? "http://localhost:8000/uploads/publicPics"
      : "http://34.239.106.12/uploads/publicPics",
};
