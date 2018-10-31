const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const jwt = require("../../JWTsecret.js");
const querystring = require("querystring");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};
	let cookies = querystring.parse(fullHeaders.cookie);
	if (!cookies.authToken) {
		responseJSON.success = false;
		responseJSON.status = 400;
		responseJSON.message = "Not signed in";
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	}
	jwt.verify(cookies.authToken, function(err, decoded) {
		if (err) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "Not signed in";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		responseJSON.success = true;
		responseJSON.status = 200;
		responseJSON.message = "Signed in";
		responseJSON.data = {
			userId: decoded.userId,
			displayName: decoded.displayName
		}
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	});
}