const one_decade = 315360000;
const one_year = 31536000;
const one_month = 2592000;
const one_week = 604800;
const one_day = 86400;
const one_hour = 3600;
const one_minute = 60;

function timeSince(past, present) {
	present = present ? new Date(new Date(present).toUTCString()) : new Date(new Date().toUTCString());
	past = new Date(new Date(past).toUTCString());

	let timeSinceInSeconds = Math.floor((present - past) / 1000);
	let interval;
	let checkString;

	function check(string) {
		if (interval > 1) {
			return interval + " " + string + "s";
		} else if (interval > 0) {
			return interval + " " + string;
		}
		return false;
	}

	interval = Math.floor(timeSinceInSeconds / one_year);
	checkString = check("year"); if (checkString) return checkString;

	interval = Math.floor(timeSinceInSeconds / one_month);
	checkString = check("month"); if (checkString) return checkString;

	interval = Math.floor(timeSinceInSeconds / one_week);
	checkString = check("week"); if (checkString) return checkString;

	interval = Math.floor(timeSinceInSeconds / one_day);
	checkString = check("day"); if (checkString) return checkString;

	interval = Math.floor(timeSinceInSeconds / one_hour);
	checkString = check("hour"); if (checkString) return checkString;

	interval = Math.floor(timeSinceInSeconds / one_minute);
	checkString = check("minute"); if (checkString) return checkString;

	return timeSinceInSeconds <= 1 ? "1 second" : timeSinceInSeconds + " seconds";
}
