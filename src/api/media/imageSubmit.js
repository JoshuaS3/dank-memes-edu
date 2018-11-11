const path = require("path");
const formidable = require("formidable");
const responseSetting = require("../../responseSetting.js");
const mySQLconnection = require("../../mySQLconnection.js");
const fs = require("fs");
const logger = require("../../logger.js");

const mime = ['image/jpeg', 'image/png', 'image/gif']

module.exports = function(request, fullHeaders, response, truncatedUrl) {
	let responseJSON = {};
	logger.v("MediaSubmit", `Request made to submit an image`);
	let form = new formidable.IncomingForm();
	form.hash = 'md5';
	form.parse(request, function (err, fields, files) {
		if (err) {
			console.log(err);
			responseJSON.success = false;
			responseJSON.status = 400;
			responseJSON.message = "The request is invalid";
			responseSetting.setResponseFullJSON(response, responseJSON);
			return;
		}

		for (var file in files) {
			let tempPath = files[file].path;
			if (files[file].size > 2e7) { // no files > 20 MB
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "The submitted file's size is too large (20MB maximum = 20,000,000 bytes)";
				logger.v("MediaSubmit", `Request made to submit an image denied for being greater than 20MB`);
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}
			if (mime.indexOf(files[file].type) == -1) {
				responseJSON.success = false;
				responseJSON.status = 400;
				responseJSON.message = "The submitted file's type is not supported";
				logger.v("MediaSubmit", `Request made to submit an image denied for not being a supported file type`);
				responseSetting.setResponseFullJSON(response, responseJSON);
				return;
			}

			fs.readFile(tempPath, function(err, imageBuffer) {
				if (err) {
					responseJSON.success = false;
					responseJSON.status = 500;
					responseJSON.message = err.toString();
					logger.e("MediaSubmit", `Request made to submit an image failed for a read error`, err);
					responseSetting.setResponseFullJSON(response, responseJSON);
					return;
				}

				let checkQuery = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
				mySQLconnection.query(checkQuery, [files[file].hash], function(err, result) {
					if (err) {
						responseJSON.success = false;
						responseJSON.status = 500;
						responseJSON.message = err.toString();
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					}
					if (result.length == 0) {
						let query = "INSERT INTO `joshuas3`.`images` SET ?"
						let values = {
							id: files[file].hash,
							image: imageBuffer,
							mime: files[file].type
						}
						mySQLconnection.query(query, values, function(err, results) {
							if (err) {
								responseJSON.success = false;
								responseJSON.status = 500;
								responseJSON.message = err.toString();
								responseSetting.setResponseFullJSON(response, responseJSON);
								return;
							}
							responseJSON.success = true;
							responseJSON.status = 200;
							responseJSON.data = {
								"id": files[file].hash
							}
							logger.v("MediaSubmit", `Image submitted with ID ${files[file].hash}, responding...`);
							responseSetting.setResponseFullJSON(response, responseJSON);
							return;
						});
					} else {
						responseJSON.success = true;
						responseJSON.status = 200;
						responseJSON.data = {
							"id": files[file].hash
						}
						logger.v("MediaSubmit", `Image submitted with ID ${files[file].hash}, responding...`);
						responseSetting.setResponseFullJSON(response, responseJSON);
						return;
					}
				});
			})
		};
	});
};