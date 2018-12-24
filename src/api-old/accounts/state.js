const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const httpBodyParser = require("../../httpBodyParser.js");
const jwt = require("../../JWTsecret.js");
const cookie = require("cookie");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let cookies = cookie.parse(fullHeaders.cookie || "");
		logger.v("AccountsGetState", "Processing request to check for login status");
		if (!cookies.authToken) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "Not signed in";
			logger.v("AccountsGetState", "Request to check for login status processed; not logged in");
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		jwt.verify(cookies.authToken, function(err, decoded) {
			if (err) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "Not signed in";
				logger.v("AccountsGetState", "Request to check for login status processed; not logged in");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			responseJSON.success = true;
			responseJSON.status = 200;
			responseJSON.message = "Signed in";
			responseJSON.data = decoded;
			logger.v("AccountsGetState", "Request to check for login status processed; logged in");
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		});
	});
}