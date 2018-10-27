const path = require("path");
const formidable = require("formidable");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const fs = require("fs");

const mime = ['image/jpeg', 'image/png']

module.exports = function(request, fullHeaders, response) {
	let responseJSON = {};
	let form = new formidable.IncomingForm();
	form.hash = 'md5';
	form.parse(request, function (err, fields, files) {
		if (err) {
			console.log(err);
			responseJSON.status = "fail";
			responseJSON.code = 400;
			responseJSON.message = "The request is invalid.";
			responseSetting.setResponseFullJSON(response, 400, responseJSON);
			return;
		}

		for (var file in files) {
			let tempPath = files[file].path;
			if (files[file].size > 20971520) { // no files > 20 MiB
				responseJSON.status = "fail";
				responseJSON.code = 400;
				responseJSON.message = "The submitted file's size is too large (20MiB maximum = 20,971,520 bytes).";
				responseSetting.setResponseFullJSON(response, 400, responseJSON);
				return;
			}
			if (mime.indexOf(files[file].type) == -1) {
				responseJSON.status = "fail";
				responseJSON.code = 400;
				responseJSON.message = "The submitted file's type is not supported.";
				responseSetting.setResponseFullJSON(response, 400, responseJSON);
				return;
			}

			fs.readFile(tempPath, function(err, imageBuffer) {
				if (err) {
					responseJSON.status = "error";
					responseJSON.code = 500;
					responseJSON.message = err.toString();
					responseSetting.setResponseFullJSON(response, 500, responseJSON);
					return;
				}

				let checkQuery = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
				mySQLconnection.query(checkQuery, [files[file].hash], function(err, result) {
					if (err) {
						responseJSON.status = "error";
						responseJSON.code = 500;
						responseJSON.message = err.toString();
						responseSetting.setResponseFullJSON(response, 500, responseJSON);
						return;
					}
					if (result.length == 0) {
						let query = "INSERT INTO `joshuas3`.`images` SET ?"
						let values = {
							id: files[file].hash,
							image: imageBuffer,
							mime: files[file].type
						}
						mySQLconnection.query(query, values, function(err, da) {
							if (err) {
								responseJSON.status = "error";
								responseJSON.code = 500;
								responseJSON.message = err.toString();
								responseSetting.setResponseFullJSON(response, 500, responseJSON);
								return;
							}
							response.writeHead(302, {'Location': '/'});
							response.end();
							return;
						});
					} else {
						response.writeHead(302, {'Location': '/'});
						response.end();
						return;
					}
				});
			})
		};

		responseJSON.status = "fail";
		responseJSON.code = 400;
		responseJSON.message = "The request is invalid.";
		responseSetting.setResponseFullJSON(response, 400, responseJSON);
		return;
	});
};