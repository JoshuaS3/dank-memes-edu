const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		logger.v("PostsInfo", "Processing request to get a post's info");

		let id = parseInt(fullHeaders.id) || body.id;
		if (!id) {
			responseSetting.setResponseFullHTML(response, 404);
			logger.v("PostsInfo", "Request to get a post's info denied for not supply a proper post ID");
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
				logger.v("PostsInfo", "Request to get a post's info denied for not supply a proper post ID");
				return;
			}

			responseJSON.success = true;
			responseJSON.status = 200;
			responseJSON.data = results[0];
			logger.v("PostsInfo", "Request to get a post's info processed");
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		});
	});
}