let mongoose = require("mongoose");
let router = require("express").Router();
let { OkResponse, BadRequestResponse, UnauthorizedResponse } = require("express-http-response");

let User = mongoose.model("User");

module.exports = router;
