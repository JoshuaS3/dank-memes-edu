const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};
	responseJSON.success = true;
	responseJSON.status = 200;
	response.setHeader("Set-Cookie", `authToken=; expires=Thu, Jan 01 1970 00:00:00 UTC`);
	responseSetting.setResponseFullJSON(response, responseJSON);
	return;
}