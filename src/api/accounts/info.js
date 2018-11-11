const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let id = parseInt(fullHeaders.id) || body.id;
		if (!id) {
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "Parameter `id` is required";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}

		let query = "SELECT id,displayName FROM `joshuas3`.`accounts` WHERE id = ? ";
		mySQLconnection.query(query, [id], function (err, results) {
			if (err)
			{
				responseJSON.success = false;
				responseJSON.status = 500;
				responseJSON.message = err.toString();
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (results.length == 0) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "User is nonexistent";
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}

			responseJSON.success = true;
			responseJSON.status = 200;
			responseJSON.data = results[0];
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		});
	});
}