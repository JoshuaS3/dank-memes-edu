const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const httpBodyParser = require("../../httpBodyParser.js");
const fs = require("fs");
const jwt = require("../../JWTsecret.js");
const cookie = require("cookie");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	logger.v("LoggingGet", "Processing request to fetch logs");

	httpBodyParser(request, responseJSON, function(body) {
		let verbosity = body.verbosity || fullHeaders.verbosity || "INFO";
		let tag = body.tag || fullHeaders.tag || ".*";
		let start = body.start || fullHeaders.start || 0;
		let end = body.end || fullHeaders.end || 50;

		verbosity = verbosity.toUpperCase();
		if (verbosity == "INFO") verbosity = "INFO|WARN|ERROR";
		if (verbosity == "DEBUG") verbosity = "INFO|DEBUG|WARN|ERROR";
		if (verbosity == "VERBOSE") verbosity = "INFO|DEBUG|VERBOSE|WARN|ERROR";
		if (verbosity == "VERY_VERBOSE") verbosity = ".*";

		logger.vv("LoggingGet", `Attempting to request fetch logs with start ${start}, end ${end}, verbosity ${verbosity}, and tag ${tag}`);

		let cookies = cookie.parse(fullHeaders.cookie || "");
		if (!cookies.authToken) {
			responseJSON.success = false;
			responseJSON.status = 403;
			responseJSON.message = "Not signed in";
			logger.v("LoggingGet", "Request to fetch logs denied for not being signed in");
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}

		jwt.verify(cookies.authToken, function(err, decoded) {
			if (err) {
				responseJSON.success = false;
				responseJSON.status = 403;
				responseJSON.message = "Not signed in";
				logger.v("LoggingGet", "Request to fetch logs denied for not being signed in");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			fs.readFile(logger.outputFile, function(err, buffer) {
				if (err) {
					responseJSON.success = false;
					responseJSON.status = 500;
					responseJSON.message = err.toString();
					logger.e("LoggingGet", "Request to fetch logs denied due to a file reading error", err);
					responseSetting.setResponseFullJSON(response, responseJSON);
					return;
				}
				let regex = new RegExp(`.*\\|\\ (?:${verbosity})\\ \\|\\ (?:${tag})\\ \\|\\ .*?(?:[\\n].*?)*(?={EOT})`, "g");
				console.log(regex);
				let fullLog = buffer.toString();
				let m;
				let fullResponse = [];

				while ((m = regex.exec(fullLog)) !== null) {
					if (m.index === regex.lastIndex) {
						regex.lastIndex++;
					}

					m.forEach(function (match) {
						if (match.length > 0) {
							fullResponse.push(match);
						}
					});
				}

				let filteredResponse = fullResponse.slice(start, end);

				responseJSON.success = true;
				responseJSON.status = 200;
				responseJSON.data = {
					count: filteredResponse.length,
					list: filteredResponse
				}
				logger.v("LoggingGet", "Request to fetch logs processed");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			});
		});
	});
}