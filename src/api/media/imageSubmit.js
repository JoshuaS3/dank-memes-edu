const path = require("path");
const formidable = require("formidable");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const md5 = require("md5");
const fs = require("fs");

const mime = ['image/jpeg', 'image/png']

module.exports = function(request, fullHeaders, response, responseJSON) {
	let form = new formidable.IncomingForm();
	form.parse(request, function (err, fields, files) {
		if (err) {
			responseJSON.status = "fail";
			responseJSON.code = 400;
			responseJSON.message = "The request is invalid.";
			responseSetting.setResponseFullJSON(response, 400, responseJSON);
			return true;
		}

		for (var file in files) {
			let tempPath = files[file].path;
			if (mime.indexOf(files[file].type) == -1) {
				responseJSON.status = "fail";
				responseJSON.code = 400;
				responseJSON.message = "The submitted file's type is not supported.";
				responseSetting.setResponseFullJSON(response, 400, responseJSON);
				return;
			}
			if (files[file].size > 20971520) { // no files > 20 MiB
				responseJSON.status = "fail";
				responseJSON.code = 400;
				responseJSON.message = "The submitted file's size is too large (20MiB maximum = 20,971,520 bytes).";
				responseSetting.setResponseFullJSON(response, 400, responseJSON);
				return true;
			}


			fs.readFile(tempPath, function(err, imageBuffer) {
				if (err) {
					responseJSON.status = "error";
					responseJSON.code = 500;
					responseJSON.message = err.toString();
					responseSetting.setResponseFullJSON(response, 500, responseJSON);
					return true;
				}
				let hashedImage = md5(imageBuffer.toString('hex'));

				let checkQuery = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
				mySQLconnection.query(checkQuery, [hashedImage], function(err, result) {
					if (err) {
						responseJSON.status = "error";
						responseJSON.code = 500;
						responseJSON.message = err.toString();
						responseSetting.setResponseFullJSON(response, 500, responseJSON);
						return true;
					}
					if (result == '') {
						let query = "INSERT INTO `joshuas3`.`images` SET ?"
						let values = {
							id: hashedImage,
							image: imageBuffer,
							mime: files[file].type
						}
						mySQLconnection.query(query, values, function(err, da) {
							if (err) {
								responseJSON.status = "error";
								responseJSON.code = 500;
								responseJSON.message = err.toString();
								responseSetting.setResponseFullJSON(response, 500, responseJSON);
								return true;
							}
							response.writeHead(302, {'Location': '/'});
							response.end();
							return true;
						});
					} else {
						response.writeHead(302, {'Location': '/'});
						response.end();
					}
				});
			})
		};
	});
};