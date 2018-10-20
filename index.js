console.log("Entry point");
// TO DO: Proper logging
// `Logger.i(String tag, String message, [Exception e])`
// `Logger.log(Logger.Severity.INFO, String tag, String message, [Exception e])`
// I=Info, W=Warning, V=Verbose

console.log("Acquiring necessary modules");
const http = require("http");
const fs = require("fs");
const path = require("path");
const urlLib = require("url");
const responseSetting = require("./src/responseSetting.js");

console.log("Loading server structure");
const serverStructure = require("./serverStructure.json");

serverStructure.forEach(function (serverData) {
	function serverFunction(request, response) {
		let canSendResponse = false;
		let fullHeaders = Object.assign(urlLib.parse(request.url, true).query, request.headers);
		let truncatedUrl = request.url.split("?")[0];
		console.log(fullHeaders);

		// Logic for API endpoints
		serverData.apiLogic.forEach(function (apiPage) {

			if (canSendResponse) return;

			// if the requested URL is listed in the serverStructure model
			if (truncatedUrl == apiPage.webApiAddress || apiPage.aliases.indexOf(truncatedUrl) > -1) {

				// if the request type is accepted
				if (request.method == apiPage.acceptedMethod) {

					// check for a proper payload
					let improperPayload = false;
					apiPage.acceptedPayload.forEach(function (acceptedPayloadKey) {
						if (fullHeaders[acceptedPayloadKey] == null) {
							improperPayload = true;
							return;
						}
					});
					if (improperPayload) { // payload is improper, send 400 error
						responseSetting.setResponseFullHTML(response, 400); // TO DO: Create proper error diagnosis structure, send JSON back
						canSendResponse = true;
						return;
					}

					let htmlCode, contentType, apiResponse = require(apiPage.logicHandler)(request, fullHeaders, response); // pass the request to the proper endpoint handler

					// write the response given by the handler
					responseSetting.setResponseHeader(response, htmlCode, contentType);
					response.write(apiResponse);
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
						responseSetting.setResponseFullHTML(response, 400);
						canSendResponse = true;
						return;
					}
				}
			}
		});
		if (canSendResponse) {
			return response.end();
		}

		serverData.staticServing.forEach(function (staticPage) {
						if (canSendResponse) return;

			if (truncatedUrl == staticPage.webAddress || staticPage.aliases.indexOf(truncatedUrl) > -1) { // requested URL

				let staticPath = path.join(__dirname, staticPage.localResponseFile);
				if (fs.existsSync(staticPath)) { // if the file exists
					let staticPageContent = fs.readFileSync(staticPage.localResponseFile).toString();
					responseSetting.setResponseHeader(response, 200, 'text/html');
					response.write(staticPageContent);
					canSendResponse = true;
				}
			}
		});
		if (canSendResponse) {
			return response.end();
		}


		if (!canSendResponse) { // none of the iterated pages matches the request URL, 404 not found
			responseSetting.setResponseFullHTML(response, 404);
			return response.end();
		} else { // error handling; it is said that a response can be sent but it hasn't already
			responseSetting.setResponseFullHTML(response, 500);
			return response.end();
		}
	}
	serverData.activePorts.forEach(function (port) {
		newHttpServer = http.createServer(serverFunction);
		newHttpServer.listen(port);
		console.log("Listening on port " + port);
	});
});

