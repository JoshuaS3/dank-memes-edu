console.log("Entry point");
// TO DO: Proper logging
// `Logger.i(String tag, String message, [Exception e])`
// `Logger.log(Logger.Severity.INFO, String tag, String message, [Exception e])`
// I=Info, W=Warning, V=Verbose

console.log("Acquiring necessary modules");
const http = require("http");
const fs = require("fs");
const path = require("path");
const qs = require('querystring');
const urlLib = require("url");
const mysql = require("mysql");
const responseSetting = require("./src/responseSetting.js");

console.log("Loading server structure");
const serverStructure = require("./serverStructure.json");

console.log("Requiring API endpoints");
serverStructure.forEach(function (serverData) {
	serverData.apiLogic.forEach(function (apiPage) {
		apiPage.logicHandler = require(apiPage.logicHandler); // require the API endpoint logic handlers before use
	});
});

console.log("Establishing MySQL connection");
const mySQLconnection = require("./src/mySQLconnection.js");

serverStructure.forEach(function (serverData) {
	function serverFunction(request, response) {
		let canSendResponse = false;
		let fullHeaders = Object.assign(urlLib.parse(request.url, true).query, request.headers);
		let body = '';
		let truncatedUrl = request.url.split("?")[0];

		request.on('data', (chunk) => {
			body += chunk;
		}).on('end', () => {
			fullHeaders = Object.assign(fullHeaders, qs.parse(body));
			console.log(fullHeaders);


			// Logic for API endpoints
			serverData.apiLogic.forEach(function (apiPage) {

				if (canSendResponse) return;

				// if the requested URL is listed in the serverStructure model
				if (truncatedUrl == apiPage.webApiAddress || apiPage.aliases.indexOf(truncatedUrl) > -1) {
					let responseJSON = {};
					responseJSON.status = "fail";
					responseJSON.code = 400;
					responseJSON.data = {};

					// if the request type is accepted
					if (request.method == apiPage.acceptedMethod) {

						// check for a proper payload
						let improperPayload = false;
						apiPage.requiredPayload.forEach(function (requiredPayloadKey) {
							if (fullHeaders[requiredPayloadKey] == null) {
								improperPayload = true;
								responseJSON.status = "fail";
								responseJSON.code = 400;
								responseJSON.data[requiredPayloadKey] = `The header/payload key ${requiredPayloadKey} is required.`
							}
						});
						if (improperPayload) { // payload is improper, send 400 error
							responseSetting.setResponseFullJSON(response, 400, responseJSON); // TO DO: Create proper error diagnosis structure, send JSON back
							canSendResponse = true;
							return;
						}

						apiPage.logicHandler(request, fullHeaders, response, responseJSON); // pass the request to the proper endpoint handler, always returns true
						canSendResponse = true;
						return;
					} else { // request type is not the right one
						let anotherUniteratedRequestTypeExists = false;
						serverData.apiLogic.forEach(function (possibleDuplicateApiPage) { // iterate through the API pages again to find a potential match
							if (anotherUniteratedRequestTypeExists) return;

							if (possibleDuplicateApiPage != apiPage) { // make sure it's not the current one
								if (truncatedUrl == possibleDuplicateApiPage.webApiAddress || possibleDuplicateApiPage.aliases.indexOf(truncatedUrl) > -1) { // if there's a match
									if (serverData.apiLogic.indexOf(possibleDuplicateApiPage) > serverData.apiLogic.indexOf(apiPage)) { // make sure it's not already been iterated through
										anotherUniteratedRequestTypeExists = true;
										return;
									}
								}
							}
						});
						if (!anotherUniteratedRequestTypeExists) {
							responseJSON.status = "fail";
							responseJSON.message = `Incorrect HTTP method used. ${request.method} was used when ${apiPage.acceptedMethod} should be used instead.`;
							responseJSON.code = 400;
							responseSetting.setResponseFullJSON(response, 400, responseJSON);
							canSendResponse = true;
							return;
						}
					}
				}
			});
			if (canSendResponse) {
				return;
			}

			serverData.staticServing.forEach(function (staticPage) { // server static pages to users
				if (canSendResponse) return;

				if (truncatedUrl == staticPage.webAddress || staticPage.aliases.indexOf(truncatedUrl) > -1) { // requested URL

					let staticPath = path.join(__dirname, staticPage.localResponseFile);
					if (fs.existsSync(staticPath)) { // if the file exists
						let staticPageContent = fs.readFileSync(staticPath).toString(); // read from file

						for (var fragmentName in staticPage.fileSplit) { // file may be split into fragments
							fragmentPath = staticPage.fileSplit[fragmentName];

							if (fs.existsSync(fragmentPath)) { // if fragment exists

								let fragmentContent = fs.readFileSync(fragmentPath).toString(); // read content of fragment
								staticPageContent = staticPageContent.replace(`<@${fragmentName}>`, fragmentContent); // place fragment in full file
							
							} else { // no such fragment exists
								staticPageContent = staticPageContent.replace(`<@${fragmentName}>`, ""); // remove snippet from code
							}
						}
						responseSetting.setResponseHeader(response, 200, 'text/html');
						response.write(staticPageContent);
						response.end();
						canSendResponse = true;
					}
				}
			});
			if (canSendResponse) {
				return;
			}


			if (!canSendResponse) { // none of the iterated pages matches the request URL, 404 not found
				responseSetting.setResponseFullHTML(response, 404);
				return response.end();
			} else { // error handling; it is said that a response can be sent but it hasn't already
				let responseJSON = {};
				responseJSON.status = "error";
				responseJSON.message = "Internal server failure.";
				responseJSON.code = 500;
				responseSetting.setResponseFullJSON(response, 500, responseJSON);
				return response.end();
			}
		});
	}
	serverData.activePorts.forEach(function (port) {
		newHttpServer = http.createServer(serverFunction);
		newHttpServer.listen(port);
		newHttpServer.on('error', function (e) {
			console.log("Server error: ");
			console.log(e.toString());
		});
		console.log("Listening on port " + port);
	});
});

