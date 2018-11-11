const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const httpBodyParser = require("../../httpBodyParser.js");
const logger = require("../../logger.js");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	httpBodyParser(request, responseJSON, function(body) {
		let imageHashValue = truncatedUrl.match(/[0-9A-Fa-f]{32}/g);

		if (!imageHashValue) {
			responseSetting.setResponseFullHTML(response, 404);
			response.end();
			return;
		}

		logger.v("Request", `Request made to fetch image ID ${imageHashValue}`);


		let query = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
		mySQLconnection.query(query, [imageHashValue], function (err, result) {
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
				return true;
			}

			let htmlCode = 200;
			responseSetting.setResponseHeader(response, htmlCode, result[0].mime);
			logger.v("Request", `Responding to request for image ID ${imageHashValue}`);
			response.end(result[0].image, 'binary');
			return true;
		});
	});
}