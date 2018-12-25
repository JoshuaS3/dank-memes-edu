const logger = require("./logger.js");

function acquire(module) {
	logger.i("Init", `Acquiring \`${module}\``);
	return require(module);
}

const fs = acquire("fs");
const path = acquire("path");
const urlLib = acquire("url");
const md5 = acquire("md5");

const codes = acquire("./codes.json");
const mimes = acquire("./mimes.json");

const responseSetting = acquire("./responseSetting.js");
const addressChecker = acquire("./addressChecker.js");


module.exports = function(subdomain) {
	if (!subdomain) return;
	if (!subdomain.type) return;

	let handlerFunction;

	if (subdomain.type == "API") {
		if (!subdomain.apiEndpoints) return;


		let apiDir = "../" + subdomain.apiEndpoints + "/";
		let endpointDirectories = [];
		let endpointDirectoryMetadataLocations = require(apiDir + "metadata.json");

		endpointDirectoryMetadataLocations.forEach(function(endpointDirectoryMetadataLocation) {
			let endpointDirectoryMetadata = require(apiDir + endpointDirectoryMetadataLocation);
			endpointDirectoryMetadata.forEach(function (endpointDirectory) {
				endpointDirectories.push(endpointDirectory);
			});
		});


		handlerFunction = function(request, response) {
			let url = request.url.split("?")[0].replace(/\/$/, "");
			let headers = request.headers;
			let params = urlLib.parse(request.url, true).query;

			let finished = false;

			let splitUrl = url.split("/");
			let apiVersion = splitUrl[1];
			let urlPath1 = splitUrl[2];
			let urlPath2 = splitUrl[3];

			endpointDirectories.forEach(function (endpointDirectory) {
				if (finished) return;
				if (apiVersion === endpointDirectory.version && urlPath1 === endpointDirectory.directory) {
					endpointDirectory.endpoints.forEach(function (endpoint) {
						if (finished) return;
						if (addressChecker(urlPath2, endpoint.name)) {
							endpoint.accepts.forEach(function (method) {
								if (finished) return;
								let requestMethod = request.method.toUpperCase();
								if (method == requestMethod) {
									let handler = require(apiDir + endpointDirectory.directory + "/" + endpoint.handler)[requestMethod]
									handler(request, headers, url, response);
									finished = true;
								}
							});
						}
					});
				}
			});

			if (!finished) {
				response.end();
			}

			return finished;
		}
	} else if (subdomain.type == "static") {
		if (!subdomain.staticFolder && !subdomain.customAddresses) return;
		handlerFunction = function(request, response) {

		}
	}

	return handlerFunction;
}
