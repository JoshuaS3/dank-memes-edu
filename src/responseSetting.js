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
	response.writeHead(code, {"Content-Type": contentType});
};
module.exports.setResponseHeaderHTML = function(response, code) {
	response.writeHead(code, {"Content-Type": "text/html"});
};
module.exports.setResponseHeaderJSON = function(response, code) {
	response.writeHead(code, {"Content-Type": "application/json"});
};
module.exports.setResponseFullJSON = function(response, code, data) {
	response.writeHead(code, {"Content-Type": "application/json"});
	response.write(JSON.stringify(data));
	response.end();
};
module.exports.setResponseFullHTML = function(response, code) {
	response.writeHead(code, {"Content-Type": "text/html"});
	response.write(code.toString() + " - " + (httpCodes[code.toString()] ? httpCodes[code.toString()] : "UNKNOWN ERROR"));
	response.end();
};

