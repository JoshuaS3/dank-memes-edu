const path = require("path");
const fs = require("fs");


function formatDate() {
	let newDate = new Date();
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

let outputFile = path.join(__dirname, path.join("../logs", (formatDate().replace(/[\/:.]/g, '-') + ".log")));

let queue = [];
function update() {
	let queueLength = queue.length
	if (queueLength > 0) {
		fs.appendFile(outputFile, queue[0], function (err) {
			if (err) throw(err);
			queue.shift();
			if ((queueLength - 1) > 0) update();
		});
	}
}


function info(tag, message) {
	let now = formatDate();
	let compiled = now + " | I | " + tag.toUpperCase() + " | " + message + "\n";
	queue.push(compiled);
	update();
}
function debug(tag, message) {
	let now = formatDate();
	let compiled = now + " | D | " + tag.toUpperCase() + " | " + message + "\n";
	queue.push(compiled);
	update();
}
function verbose(tag, message) {
	let now = formatDate();
	let compiled = now + " | V | " + tag.toUpperCase() + " | " + message + "\n";
	queue.push(compiled);
	update();
}
function warn(tag, message) {
	let now = formatDate();
	let compiled = now + " | W | " + tag.toUpperCase() + " | " + message + "\n";
	queue.push(compiled);
	update();
}
function error(tag, message, error) {
	let now = formatDate();
	let compiled = now + " | E | " + tag.toUpperCase() + " | " + message + "\n\n" + error.toString() + "\n\n";
	queue.push(compiled);
	update();
}

module.exports = {
	i: info,
	d: debug,
	v: verbose,
	w: warn,
	e: error
}