const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const httpBodyParser = require("../../httpBodyParser.js");
const fs = require("fs");
const path = require("path");
const jwt = require("../../JWTsecret.js");
const cookie = require("cookie");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	logger.v("LoggingGet", "Processing request to fetch logs");

	httpBodyParser(request, responseJSON, function(body) {
		let filename = body.file || fullHeaders.file || null;
		let verbosity = body.verbosity || fullHeaders.verbosity || "INFO";
		let tag = body.tag || fullHeaders.tag || ".*";
		let start = body.start || fullHeaders.start || 0;
		let count = body.count || fullHeaders.count || 200;

		verbosity = verbosity.toUpperCase();
		tag = tag.toUpperCase();
		if (verbosity == "INFO") verbosity = "INFO|WARN|ERROR";
		if (verbosity == "DEBUG") verbosity = "INFO|DEBUG|WARN|ERROR";
		if (verbosity == "VERBOSE") verbosity = "INFO|DEBUG|VERBOSE|WARN|ERROR";
		if (verbosity == "VERY_VERBOSE") verbosity = ".*";

		logger.vv("LoggingGet", `Attempting to request fetch logs with start ${start}, count ${count}, verbosity ${verbosity}, and tag ${tag}`);

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
			if (!decoded.superuser) {
				responseJSON.success = false;
				responseJSON.status = 403;
				responseJSON.message = "Improper permissions";
				logger.v("LoggingGet", "Request to fetch logs denied for not being a superuser");
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			fs.readFile(path.join(logger.logPath, filename), function(err, buffer) {
				if (err) {
					responseJSON.success = false;
					responseJSON.status = 500;
					responseJSON.message = err.toString();
					logger.e("LoggingGet", "Request to fetch logs denied due to a file reading error", err);
					responseSetting.setResponseFullJSON(response, responseJSON);
					return;
				}
				let filestat = fs.statSync(path.join(logger.logPath, filename));
				let regex = new RegExp(`.*\\|\\ (?:${verbosity})\\ \\|\\ (?:${tag})\\ \\|\\ .*?(?:[\\n].*?)*(?={EOT})`, "g");
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

				let filteredResponse = fullResponse.slice(start, start + count);

				responseJSON.success = true;
				responseJSON.status = 200;
				responseJSON.data = {
					filename: filename,
					filedate: filestat.birthtime,
					filesize: filestat.size,
					count: filteredResponse.length,
					list: filteredResponse
				}
				logger.v("LoggingGet", "Request to fetch logs processed");
				responseSetting.setResponseFullJSON(response, responseJSON);
				done = true;
				return;
			});
		});
	});
}