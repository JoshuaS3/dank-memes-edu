const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response, responseJSON) {
	logger.v("AlertList", "Processing request to list alerts...");
	let query = "SELECT * FROM joshuas3.alerts"
	mySQLconnection.query(query, function(err, results) {
		if (err) {
			responseJSON.success = false;
			responseJSON.status = 500;
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}
		responseJSON.success = true;
		responseJSON.status = 200;
		responseJSON.data = results;
		logger.v("AlertList", "Request to list alerts processed.");
		responseSetting.setResponseFullJSON(response, responseJSON);
		return;
	});
}