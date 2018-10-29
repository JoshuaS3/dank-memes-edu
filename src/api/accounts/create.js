const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");
const jwt = require("jsonwebtoken");
const JWTsecret = require("../../JWTsecret.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");

function displayNameTaken(name, callback) {
	let query = "SELECT displayName FROM `joshuas3`.`accounts` WHERE displayName = ? ";
	mySQLconnection.query(query, [name], function (err, result) {
		if (err) {
			callback(true);
			return true;
		}
		if (result[0].displayName) {
			logger.v("AccountCreation", "Requested account name already taken");
			callback(true);
			return;
		}
		callback(false);
		return;
	});
}


module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body){
		console.log(body);
		let verToken = body.verToken || null;
		let firstName = body.firstName || null;
		let lastName = body.lastName || null;
		let displayName = body.displayName || null;
		let email = body.email || null;
		let password = body.password || null;
		if (!verToken) {
			responseJSON.success = false;
			responseJSON.status = 403;
			responseJSON.message = "Auth token `verToken` is required";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		jwt.verify(verToken, JWTsecret, function(err, decoded) {
			if (err) {
				if (err.name == 'TokenExpiredError') {
					responseJSON.success = false;
					responseJSON.status = 403;
					responseJSON.message = "Auth token `verToken` has expired";
					responseSetting.setResponseFullJSON(response, responseJSON);
					return;
				}
				responseJSON.success = false;
				responseJSON.status = 403;
				responseJSON.message = "Auth token `verToken` is invalid";
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (decoded.accountCreation) {
				if (!displayName) {
					responseJSON.success = false;
					responseJSON.status = 400;
					responseJSON.message = "Parameter `displayName` is required";
					responseSetting.setResponseFullJSON(response, responseJSON);
					return;
				}

				displayNameTaken(displayName, function(taken){
					if (taken) {
						responseJSON.success = false;
						responseJSON.status = 400;
						responseJSON.message = "The requested display name has been taken";
						responseSetting.setResponseFullJSON(response, responseJSON);
					}

					if (displayName.length > 20) {
						responseJSON.success = false;
						responseJSON.status = 400;
						responseJSON.message = "Parameter `displayName` is longer than 20 characters";
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					}
					if (!password) {
						responseJSON.success = false;
						responseJSON.status = 400;
						responseJSON.message = "Parameter `password` is required";
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					}
					let passwordSalt = uuidv4();
					let passwordHash = md5((password + passwordSalt).toString('hex'));

					let query = "INSERT INTO `joshuas3`.`accounts` SET ? ";
					let values = {
						firstName: firstName,
						lastName: lastName,
						displayName: displayName,
						email: email,
						passwordHash: passwordHash,
						passwordSalt: passwordSalt
					};
					mySQLconnection.query(query, values, function(err) {
						if (err) {
							responseJSON.success = false;
							responseJSON.status = 500;
							responseJSON.message = err.toString();
							responseSetting.setResponseFullJSON(response, responseJSON);
							return;
						}
						responseJSON.success = true;
						responseJSON.status = 200;
						responseJSON.message = "Successfully registered";
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					});
				});
			} else {
				responseJSON.success = false;
				responseJSON.status = 403;
				responseJSON.message = "Auth token `verToken` is invalid";
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
		});
	});
}