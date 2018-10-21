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
const mysql = require("mysql");
const responseSetting = require("./src/responseSetting.js");
const mySqlConfig = require("./mySqlConfig.json");

console.log("Loading server structure");
const serverStructure = require("./serverStructure.json");

console.log("Requiring API endpoints");
serverStructure.forEach(function (serverData) {
	serverData.apiLogic.forEach(function (apiPage) {
		apiPage.logicHandler = require(apiPage.logicHandler); // require the API endpoint logic handlers before use
	});
});

console.log("Establishing MySQL connection");
var mySQLconnection = mysql.createConnection(mySqlConfig);
mySQLconnection.connect(function (err) {
	if (err) {
		console.log("Error when establishing MySQL connection");
		throw err;
	}
});

serverStructure.forEach(function (serverData) {
	function serverFunction(request, response) {
		let canSendResponse = false;
		let fullHeaders = Object.assign(urlLib.parse(request.url, true).query, request.headers);
		let truncatedUrl = request.url.split("?")[0];

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
						response.end()
						return;
					}

					apiPage.logicHandler(request, fullHeaders, response, mySQLconnection); // pass the request to the proper endpoint handler, always returns true
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
						response.end()
						return;
					}
				}
			}
		});
		if (canSendResponse) {
			return;
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

