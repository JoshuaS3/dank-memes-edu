const qs = require("querystring");
const responseSetting = require("./responseSetting.js");
const logger = require("./logger.js");

module.exports = function (request, responseJSON, callback) {
	let responseSent = false;
	let body = ""

	request.on('data', (chunk) => {
		if (responseSent) return;
		logger.vv("HttpBodyParsing", "Receiving data, parsing...");
		if (body > 2.1e7) { // 21MB
			let responseJSON = {};
			responseJSON.success = false;
			responseJSON.code = 413;
			responseJSON.message = "Payload too large";
			responseSetting.setResponseFullJSON(response, responseJSON);
			responseSent = true;
			request.connection.end();
			logger.vv("HttpBodyParsing", "Too much data received, connection ended.");
			return;
		}
		body += chunk;
	})


	request.on('end', () => {
		logger.vv("HttpBodyParsing", "Finished receiving data.");
		body = qs.parse(body);
		callback(body);
	});

	return;
}