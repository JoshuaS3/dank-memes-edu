const logger = require("../../logger.js");
const responseSetting = require("../../responseSetting.js");
const fs = require("fs");
const path = require("path");
const jwt = require("../../JWTsecret.js");
const cookie = require("cookie");

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};

	logger.v("LoggingList", "Processing request to list logs");

	fs.readdir(logger.logPath, function(err, files) {
		files = files.map(function (fileName) {
			return {
				name: fileName,
				time: fs.statSync(path.join(logger.logPath, fileName)).birthtime.getTime()
			};
		})
		.sort(function (a, b) {
			return b.time - a.time;
		})
		.map(function (file) {
			if (file.name == ".gitkeep") {
				return {file:null, time:null};
			}
			return {
				name: file.name,
				time: new Date(file.time)
			}
		});
		responseJSON.success = true;
		responseJSON.status = 200;
		responseJSON.data = files;
		responseSetting.setResponseFullJSON(response, responseJSON);
		logger.v("LoggingList", "Request to list logs processed");
		return;
	});
}