console.log("Entry point");

console.log("Acquiring necessary modules");
const http = require("http");
const fs = require("fs");

console.log("Loading server structure");
const serverStructure = require("./serverStructure.json");

serverStructure.forEach(function (serverData) {
	function serverFunction(request, response) {
		canSendResponse = false;

		// Logic for API endpoints
		serverData.apiLogic.forEach(function (apiPage) {

			// if the requested URL is listed in the serverStructure model
			if (request.url == apiPage.webApiAddress || request.url == apiPage.aliases.indexOf(request.url) > -1) {

				// if the request type is accepted
				if (request.method == apiPage.acceptedMethod) {

					// check for a proper payload
					improperPayload = false;
					apiPage.acceptedPayload.forEach(function (acceptedPayloadKey) {
						if (request.headers.indexOf(acceptedPayload) == -1) {
							improperPayload = true;
							return;
						}
					});
					if (improperPayload) { // payload is improper, send 400 error
						response.writeHead(400, {'Content-Type': 'text/html'});
						response.write("Error 400 (Bad Request)"); // TO DO: Create proper error diagnosis structure, send JSON back
						canSendResponse = true;
						return;
					}

					htmlCode, contentType, apiResponse = require(apiPage.logicHandler)(request, response); // pass the request to the proper endpoint handler

					// write the response given by the handler
					response.writeHead(htmlCode, contentType);
					response.write(apiResponse);
					canSendResponse = true;
					return;
				} else { // request type is not the right one
					response.writeHead(400, {'Content-Type': 'text/html'}); // TO DO: Check serverData.apiLogic members to make sure there's not another of the same URL with diff HTTP method
					response.write("Error 400 (Bad Request)");
					canSendResponse = true;
					return;
				}
			}
		});
		if (canSendResponse) {
			return response.end();
		}

		serverData.staticServing.forEach(function (staticPage) {
			if (request.url == staticPage.webAddress || request.url == staticPage.aliases.indexOf(request.url) > -1) {
				fs.readFileSync(staticPage.localResponseFile).toString().split('\n').forEach(function (line) {
					// TO DO
				})
			}
		});
		if (canSendResponse) {
			return response.end();
		}


		if (!canSendResponse) {
			response.writeHead(404, {'Content-Type': 'text/html'});
			response.write("Error 404");
			return response.end();
		} else {
			response.writeHead(500, {'Content-Type': 'text/html'});
			response.write("Error 500 (Internal Server Error)");
			return response.end();
		}
	}
	newHttpServer = http.createServer(serverFunction);
	serverData.activePorts.forEach(function (port) {
		newHttpServer.listen(port);
		console.log("Listening on port " + port);
	});
});

