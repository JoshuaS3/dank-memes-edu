const path = require("path");
const fs = require("fs");


function formatDate(newDate) {
	let formatted = "";
	formatted += (newDate.getMonth() + 1).toString().padStart(2, '0');
	formatted += "/";
	formatted += newDate.getDate().toString().padStart(2, '0');
	formatted += "/";
	formatted += newDate.getFullYear().toString();
	formatted += " ";
	formatted += (newDate.getHours() + 1).toString().padStart(2, '0');
	formatted += ":";
	formatted += (newDate.getMinutes()).toString().padStart(2, '0');
	formatted += ":";
	formatted += (newDate.getSeconds()).toString().padStart(2, '0');
	formatted += ".";
	formatted += (newDate.getMilliseconds()).toString().padStart(3, '0');
	return formatted;
}

let logPath = path.join(__dirname, "../logs");
let outputFile = path.join(logPath, formatDate(new Date()).replace(/[\\\/:.]/g, '-').replace(" ", "---") + ".log");

let array = [];
function update() {
	array.sort(function(x, y){
		return x.timestamp - y.timestamp;
	});
}

function write() {
	let output = "";
	array.forEach(function (item) {
		output += item.content;
	});
	array = [];
	fs.appendFileSync(outputFile, output);
}

setInterval(write, 5000);


function addToQueue(compiled, now) {
	let toAdd = {
		timestamp: now,
		content: compiled
	}
	array.push(toAdd);
	update();
}

function info(tag, message) {
	let now = new Date();
	let compiled = formatDate(now) + " | INFO | " + tag.toUpperCase() + " | " + message + "{EOT}\n";
	addToQueue(compiled, now);
}
function debug(tag, message) {
	let now = new Date();
	let compiled = formatDate(now) + " | DEBUG | " + tag.toUpperCase() + " | " + message + "{EOT}\n";
	addToQueue(compiled, now);
}
function verbose(tag, message) {
	let now = new Date();
	let compiled = formatDate(now) + " | VERBOSE | " + tag.toUpperCase() + " | " + message + "{EOT}\n";
	addToQueue(compiled, now);
}
function very_verbose(tag, message) {
	let now = new Date();
	let compiled = formatDate(now) + " | VERY_VERBOSE | " + tag.toUpperCase() + " | " + message + "{EOT}\n";
	addToQueue(compiled, now);
}
function warn(tag, message) {
	let now = new Date();
	let compiled = formatDate(now) + " | WARN | " + tag.toUpperCase() + " | " + message + "{EOT}\n";
	addToQueue(compiled, now);
}
function error(tag, message, error) {
	let now = new Date();
	let compiled = formatDate(now) + " | ERROR | " + tag.toUpperCase() + " | " + message + "\n" + error.stack + "{EOT}\n";
	addToQueue(compiled, now);
	write();
}

module.exports = {
	i: info,
	d: debug,
	v: verbose,
	vv: very_verbose,
	w: warn,
	e: error,
	write: write,
	outputFile: outputFile,
	logPath: logPath
}