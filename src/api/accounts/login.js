const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");
const jwt = require("../../JWTsecret.js");
const md5 = require("md5");
const uuidv4 = require("uuid/v4");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let displayName = body.displayName || null;
		let password = body.password || null;
		let verToken = body.verToken || null;
		if (!verToken) {
			responseJSON.success = false;
			responseJSON.status = 403;
			responseJSON.message = "Auth token `verToken` is required";
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
		if (!displayName) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "Parameter `displayName` is required";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		jwt.verify(verToken, function(err, decoded) {
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
			if (decoded.pageValidation) {
				let query = "SELECT passwordSalt FROM `joshuas3`.`accounts` WHERE displayName = ? ";
				mySQLconnection.query(query, [displayName], function(err, results) {
					if (err) {
						responseJSON.success = false;
						responseJSON.status = 500;
						responseJSON.message = err.toString();
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					}
					if (results[0]) {
						let passwordSalt = results[0].passwordSalt;
						let hashedPassword = md5((password + passwordSalt).toString('hex'));
						let query = "SELECT id FROM `joshuas3`.`accounts` WHERE displayName = ? AND passwordHash = ? ";
						mySQLconnection.query(query, [displayName, hashedPassword], function(err, results) {
							if (err) {
								responseJSON.success = false;
								responseJSON.status = 500;
								responseJSON.message = err.toString();
								responseSetting.setResponseFullJSON(response, responseJSON);
								return;
							}
							if (results[0]) {
								responseJSON.success = true;
								responseJSON.status = 200;
								responseJSON.message = "Successfully logged in";
								responseJSON.data = {
									userid: results[0].id
								}
								let verifiedLogin = {
									userId: results[0].id,
									exp: Math.floor(Date.now() / 1000) + 3600,
									uuid: uuidv4()
								}
								let authToken = jwt.sign(verifiedLogin);
								response.setHeader("Set-Cookie", [`authToken=${authToken}`]);
								responseSetting.setResponseFullJSON(response, responseJSON);
								return;
							} else {
								responseJSON.success = false;
								responseJSON.status = 400;
								responseJSON.message = "Incorrect password";
								responseSetting.setResponseFullJSON(response, responseJSON);
							}
						});
					} else {
						responseJSON.success = false;
						responseJSON.status = 400;
						responseJSON.message = "Account does not exist";
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					}
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