const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};
	let name = fullHeaders.name || null;

	logger.v("AccountsCheckName", "Processing request to check for username availability...");

	if (!name) {
		responseJSON.success = false;
		responseJSON.status = 400;
		responseJSON.message = "Parameter `name` is required";
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	}

	let query = "SELECT displayName FROM `joshuas3`.`accounts` WHERE displayName = ? ";
	mySQLconnection.query(query, [name], function (err, result) {
		if (err) {
			responseJSON.success = false;
			responseJSON.status = 500;
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		responseJSON.success = true;
		responseJSON.status = 200;
		if (!result[0]) {
			responseJSON.data = {
				usernameTaken: true
			}
			logger.v("AccountsCheckName", `Request to check for username availability processed; username '${name}' is taken`);
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		responseJSON.data = {
			usernameTaken: false
		}
		logger.v("AccountsCheckName", `Request to check for username availability processed; username '${name}' is available`);
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	});
}