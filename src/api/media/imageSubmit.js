const path = require("path");
const formidable = require("formidable");
const responseSetting = require("../../responseSetting.js");
const md5 = require("md5");
const fs = require("fs");

const mime = ['image/jpeg', 'image/png']

module.exports = function (request, headers, response, mySQLconnection) {
	let form = new formidable.IncomingForm();
	form.parse(request, function (err, fields, files) {
		if (err) {
			let htmlCode = 400;
			responseSetting.setResponseFullHTML(response, htmlCode);
			response.end();
			return true;
		}

		for (var file in files) {
			let tempPath = files[file].path;
			if (mime.indexOf(files[file].type) == -1) {
				let htmlCode = 400;
				responseSetting.setResponseFullHTML(response, htmlCode);
				response.end();
				return true;
			}
			if (files[file].size > 20971520) { // no files > 20 MiB
				let htmlCode = 400;
				responseSetting.setResponseFullHTML(response, htmlCode);
				response.end();
				return true;
			}


			fs.readFile(tempPath, function(err, imageBuffer) {
				if (err) {
					let htmlCode = 500;
					responseSetting.setResponseFullHTML(response, htmlCode);
					response.end();
					return true;
				}
				let hashedImage = md5(imageBuffer.toString('hex'));

				let checkQuery = "SELECT * FROM `joshuas3`.`images` WHERE id = ? ";
				mySQLconnection.query(checkQuery, [hashedImage], function(err, result) {
					if (err) {
						let htmlCode = 500;
						responseSetting.setResponseFullHTML(response, htmlCode);
						response.end();
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
								let htmlCode = 500;
								responseSetting.setResponseFullHTML(response, htmlCode);
								response.end();
								return true;
							}
							response.writeHead(302, {'Location': '/image?h=' + hashedImage});
							response.end();
							return true;
						});
					} else {
						response.writeHead(302, {'Location': '/image?h=' + hashedImage});
						response.end();
					}
				});
			})
		};
	});
};