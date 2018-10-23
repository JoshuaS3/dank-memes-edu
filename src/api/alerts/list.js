const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");

module.exports = function(request, fullHeaders, response, responseJSON) {
	let query = "SELECT * FROM joshuas3.alerts"
	mySQLconnection.query(query, function(err, results) {
		if (err) {
			responseJSON.code = 500;
			responseJSON.status = "error";
			responseJSON.message = err.toString();
			responseSetting.setResponseFullJSON(response, 500, responseJSON);
			return;
		}
		responseJSON.code = 200;
		responseJSON.status = "success";
		responseJSON.data = results;
		responseSetting.setResponseFullJSON(response, 200, responseJSON);
		return;
	});
}