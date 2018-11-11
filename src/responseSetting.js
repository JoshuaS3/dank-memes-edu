const logger = require("./logger.js");
var httpCodes = {
	"200": "OK",
	"201": "CREATED",
	"204": "NO CONTENT",
	"304": "NOT MODIFIED",
	"400": "BAD REQUEST",
	"401": "UNAUTHORIZED",
	"403": "FORBIDDEN",
	"404": "NOT FOUND",
	"500": "INTERNAL SERVER ERROR",
	"503": "SERVICE UNAVAILABLE"
};

module.exports.setResponseHeader = function(response, code, contentType) {
	logger.vv("Response", `Setting response header to code ${code} with Content-Type ${contentType}`);
	response.writeHead(code, {"Content-Type": contentType});
};
module.exports.setResponseHeaderHTML = function(response, code) {
	logger.vv("Response", `Setting response header to code ${code} with Content-Type text/html`);
	response.writeHead(code, {"Content-Type": "text/html"});
};
module.exports.setResponseHeaderJSON = function(response, code) {
	logger.vv("Response", `Setting response header to code ${code} with Content-Type application/json`);
	response.writeHead(code, {"Content-Type": "application/json"});
};
module.exports.setResponseFullJSON = function(response, data) {
	logger.vv("Response", `Sending response ${JSON.stringify(data)} with status ${data.status} and Content-Type application/json`);
	response.writeHead(data.status, {"Content-Type": "application/json"});
	response.write(JSON.stringify(data));
	response.end();
};
module.exports.setResponseFullHTML = function(response, code) {
	logger.vv("Response", `Sending response with status ${code} and Content-Type text/html`);
	response.writeHead(code, {"Content-Type": "text/html"});
	response.write(code.toString() + " - " + (httpCodes[code.toString()] ? httpCodes[code.toString()] : "UNKNOWN ERROR"));
	response.end();
};

