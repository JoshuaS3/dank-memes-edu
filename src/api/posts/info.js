const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let id = parseInt(fullHeaders.id) || body.id;
		if (!id) {
			responseSetting.setResponseFullHTML(response, 404);
			response.end();
			return;
		}

		let query = "SELECT * FROM `joshuas3`.`posts` WHERE id = ? ";
		mySQLconnection.query(query, [id], function (err, result) {
			if (err)
			{
				responseJSON.success = false;
				responseJSON.status = 500;
				responseJSON.message = err.toString();
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (result.length == 0) {
				responseSetting.setResponseFullHTML(response, 404);
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