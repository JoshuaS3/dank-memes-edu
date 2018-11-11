const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let count = parseInt(fullHeaders.count) || body.count || 10;
		if (count > 100) {
			count = 100;
			responseJSON.message = "Response limited to 100 results";
		}

		let query = "SELECT * FROM joshuas3.posts ORDER BY dateCreated DESC LIMIT ?"
		mySQLconnection.query(query, [count], function(err, results) {
			if (err) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = err.toString();
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			responseJSON.success = true;
			responseJSON.status = 200;
			responseJSON.data = results;
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		});
	});
}