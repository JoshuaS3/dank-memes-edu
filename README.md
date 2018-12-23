# dank-memes-edu

A silly website for meme-hosting between school friends. Demonstrates knowledge of backend and frontend programming with AWS EC2 and Route 53 configuration, HTTPS hosting, a RESTful API, an AWS MySQL server, as well as a full user interface on the frontend.

Can be found running online at <a href="http://www.joshuas3.com" target="_blank">joshuas3.com</a>.

An Android phone app is in the works in the <a href="https://github.com/JoshuaS3/dank-memes-edu-android" target="_blank">dank-memes-edu-android repository</a>.


## Project Design

```
dank-memes-edu/
	logs/
		... (All log files should be placed here)
	src/
		api/
			(RESTful API logic handlers)
		(shared node.js modules for both `/src/api/` and `/index.js`)
	static/
		html/
			... (fragments included)
		js/
			...
		... (other misc stuff like favicon or robots.txt)

		> Every file in the static/ folder is accessible via HTTP or HTTPS. Settings can be set in serverStructure.json for custom specifics (e.g. `/` or `/home` > /static/html/index.html).

	index.js (the handler that manages all HTTP/HTTPS requests and responses for each subdomain)
	serverStructure.json (the site structure)
	status.sh (handles the node.js application)

	> The following are optional (not automatically implemented)

	JWTsecrets.json (for the website's authentication system)
	mySqlConfig.json (the site uses an AWS MySQL Server as a DB)
	reCAPTCHAsecret.json (the site also uses Google reCAPTCHA)

	> The following are optional but suggested (still not automatically implemented)

	apiDocs.json (reflective API documentation)
	codes.json (all info/warning/error codes and their meanings)

	> The following are miscellaneous but shouldn't be deleted

	.git/
	.gitignore
	.gitattributes

	node_modules/
	package.json
	package-lock.json

	dankmemesedu.sublime-project
	dankmemesedu.sublime-workspace

	LICENSE
```




### Format for serverStructure.json

If this example doesn't work, remove the comments and place commas where necessary.

The only current available subdomain types are "static" and "API".

```
[ // list of subdomains
	{ // separate port/subdomain
		"activePorts": [8080] // required, the port(s) this subdomain should be hosted on
		"type": "static" // required, specifies the domain type for index.js to handle
		"staticServing": [ // for custom-address static pages
			{
				"webAddress": "/..." // required, the relative web address this static file can be found at, must start with `/`
				"aliases": ["/..."] // optional, a list of other relative web addresses this static file can be found at
				"localResponseFile": "static/..." // required, the file that should be served to anybody who GET requests this page
				"mime": "..." // optional, inferred if not available
				"binary": {{bool}} // optional, use for binary files if `mime` isn't specified (if no `mime` variable is set while serving an `image/png` file, this should be `true`)
				"fragments": { // optional, allows the reuse of text with the <@FRAGMENTNAME> element embedded where you wish to fill in a fragment automatically
					"FRAGMENTNAME": "static/..." // required for each use of the <@FRAGMENTNAME> element in the file to be served
					...
				}
			}
			...
		]
	},
	{ // only required if you want a RESTful API. this encourages putting it on a domain separate from UI and such
		"activePorts": [8008]
		"type": "API"
		"apiEndpoints": "/src/api" // required if type is "API", index.js will automatically iterate through and manage the handlers
	}
]
```


### Format for RESTful API handlers

```javascript
const module = require ("module");

function doTheThing(...) {
	// perform the operation the endpoint should do. this is a separate function because other endpoints may require it as well, for something like checking username availability
}

var GET = function(request, url, headers, response) {
	// check for some stuff, maybe authentication
	doTheThing(...);
  // make sure to set and return the proper response
}

module.exports = {
	doTheThing: doTheThing, // this is ONLY for other backend use, never directly called for any request
	GET: GET // set the handler for GET requests, automatically found and directly used by index.js
	... // other automatically handled request types are POST, UPDATE, DELETE, PUT, CONNECT, OPTIONS, TRACE, PATCH
}
```


## TO-DO

1. Convert to HTTPS from HTTP
2. Create a blog for this
3. Move the dankmemes.edu site handler into its own repository for other custom use
4. Create a standardized format for API documentation and info/warning/error codes
5. Begin analytical tracking with either Google Analytics or my own system
6. Write a Privacy Policy or Terms and Conditions
7. Move API documentation to its own subdomain
8. Create a voting system
9. Create a reporting system
10. Create a comments system
11. Create a profile page system
12. Create a handler that manages site downtime
