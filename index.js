console.log("Entry point");

const fs = require("fs");
const path = require("path");
const formidable = require('formidable');
const http = require("http");

console.log("Constants acquired");
console.log("Starting app...");

http.createServer(function (req, res) {
	if (req.url == "/submit_meme" && req.method == 'POST') {
		var form = new formidable.IncomingForm();
		form.parse(req, function (err, fields, files) {
			var oldpath = files.filetoupload.path;
			var newpath = path.join(__dirname, path.join('files', files.filetoupload.name));
			fs.createReadStream(oldpath).pipe(fs.createWriteStream(newpath));
			res.writeHead(302, {"Location": "/"});
			return res.end();
		});
	}
	else if (req.url.startsWith("/files/"))
	{
		filename = req.url.split("/files/")[1];
		filepath = path.join(__dirname, path.join('files', filename));
		res.writeHead(200, {'Content-Type': 'image/plain'});
		return res.end(fs.readFileSync(filepath), 'binary');
	}
	else
	{
		res.writeHead(200, {'Content-Type': 'text/html'});
		fs.readFileSync('./static/start.html').toString().split('\n').forEach(function (line) {
			res.write(line);
		})

		var dir = path.join(__dirname, 'files');

		fs.readdir(dir, function(err, files){
			files = files.map(function (fileName) {
				return {
					name: fileName,
					time: fs.statSync(dir + '/' + fileName).mtime.getTime()
				};
			})
			.sort(function (a, b) {
				return b.time - a.time; })
			.map(function (v) {
				return v.name; });

			count = 0;
			files.forEach(function (file) {
				if (count++ >= 20) return;
				res.write('<div class="shadow-lg p-3 mb-2 mt-4">');
				res.write('<img class="d-block img-fluid w-100" src="/files/' + file + '"/>');
				res.write('</div>');
			});

			fs.readFileSync('./static/end.html').toString().split('\n').forEach(function (line) {
				res.write(line);
			})

			return res.end();
		});
	}
}).listen(80);

console.log("App listening at port 80");
