/*** modules ***/
	var http     = require("http")
	var fs       = require("fs")
	var mongo    = require("mongodb").MongoClient
	var database = "mongodb://" + getEnvironment("database_username") + ":" + getEnvironment("database_password") + getEnvironment("database_url")
	module.exports = {}

	var game     = require("../game/logic")

/*** logs ***/
	/* logError */
		module.exports.logError = logError
		function logError(error) {
			console.log("\n*** ERROR @ " + new Date().toLocaleString() + " ***")
			console.log(" - " + error)
			console.dir(arguments)
		}

	/* logStatus */
		module.exports.logStatus = logStatus
		function logStatus(status) {
			console.log("\n--- STATUS @ " + new Date().toLocaleString() + " ---")
			console.log(" - " + status)
		}

	/* logMessage */
		module.exports.logMessage = logMessage
		function logMessage(message) {
			console.log(" - " + new Date().toLocaleString() + ": " + message)
		}

/*** maps ***/
	/* getEnvironment */
		module.exports.getEnvironment = getEnvironment
		function getEnvironment(index) {
			try {
				if (process.env.DOMAIN !== undefined) {
					var environment = {
						port:              process.env.PORT,
						domain:            process.env.DOMAIN,
						database_username: process.env.DB_USERNAME,
						database_password: process.env.DB_PASSWORD,
						database_url:"@" + process.env.DB_URL
					}
				}
				else {
					var environment = {
						port:              3000,
						domain:            "localhost",
						database_username: "localhost",
						database_password: "",
						database_url:      "27017/chalice"
					}
				}

				return environment[index]
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* getAsset */
		module.exports.getAsset = getAsset
		function getAsset(index) {
			try {
				switch (index) {
					case "logo":
						return "logo.png"
					break
					
					case "google fonts":
						return '<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">'
					break

					case "meta":
						return '<meta charset="UTF-8"/>\n\
								<meta name="description" content="Chalice is a game of death and deception."/>\n\
								<meta name="keywords" content="game,chalice,cards,card,deduction,guess,party,tabletop"/>\n\
								<meta name="author" content="James Mayr"/>\n\
								<meta property="og:title" content="Chalice: the card game"/>\n\
								<meta property="og:url" content="https://www.chalicethegame.com"/>\n\
								<meta property="og:description" content="Chalice is a game of death and deception."/>\n\
								<meta property="og:image" content="https://www.chalicethegame.com/banner.png"/>\n\
								<meta name="viewport" content="initial-scale=1.0, width=device-width, minimum-scale=1, maximum-scale=1, user-scalable=no"/>'
					break

					default:
						return null
					break
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

/*** checks ***/
	/* isReserved */
		module.exports.isReserved = isReserved
		function isReserved(string) {
			try {
				var reservations = ["home","welcome","admin","test","feedback","help","preferences","settings","data","database",
					"signup","signin","signout","login","logout","verify","validate","verification","validation","verified","validated",
					"user","users","game","games","tutorial","tutorials","statistic","statistics","guest","guests","example","examples",
					"create","new","delete","read","start","go","all"]

				return (reservations.indexOf(string.toLowerCase().replace(/\s/g,"")) > -1)
			}
			catch (error) {
				logError(error)
				return true
			}
		}

	/* isNumLet */
		module.exports.isNumLet = isNumLet
		function isNumLet(string) {
			try {
				return (/^[a-z0-9A-Z_\s]+$/).test(string)
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* isBot */
		module.exports.isBot = isBot
		function isBot(agent) {
			try {
				switch (true) {
					case (typeof agent == "undefined" || !agent):
						return "no-agent"
					break
					
					case (agent.indexOf("Googlebot") !== -1):
						return "Googlebot"
					break
				
					case (agent.indexOf("Google Domains") !== -1):
						return "Google Domains"
					break
				
					case (agent.indexOf("Google Favicon") !== -1):
						return "Google Favicon"
					break
				
					case (agent.indexOf("https://developers.google.com/+/web/snippet/") !== -1):
						return "Google+ Snippet"
					break
				
					case (agent.indexOf("IDBot") !== -1):
						return "IDBot"
					break
				
					case (agent.indexOf("Baiduspider") !== -1):
						return "Baiduspider"
					break
				
					case (agent.indexOf("facebook") !== -1):
						return "Facebook"
					break

					case (agent.indexOf("bingbot") !== -1):
						return "BingBot"
					break

					case (agent.indexOf("YandexBot") !== -1):
						return "YandexBot"
					break

					default:
						return null
					break
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

/*** tools ***/		
	/* renderHTML */
		module.exports.renderHTML = renderHTML
		function renderHTML(request, file) {
			try {
				var html = {}
					html.original = fs.readFileSync(file).toString()
					html.array = html.original.split(/<script\snode>|<\/script>node>/gi)

				for (html.count = 1; html.count < html.array.length; html.count += 2) {
					try {
						html.temp = eval(html.array[html.count])
					}
					catch (error) {
						html.temp = ""
						logError("<sn>" + Math.ceil(html.count / 2) + "</sn>\n" + error)
					}
					html.array[html.count] = html.temp
				}

				return html.array.join("")
			}
			catch (error) {
				logError(error)
				return ""
			}
		}

	/* generateRandom */
		module.exports.generateRandom = generateRandom
		function generateRandom(set, length) {
			try {
				set = set || "0123456789abcdefghijklmnopqrstuvwxyz"
				length = length || 32
				
				var output = ""
				for (var i = 0; i < length; i++) {
					output += (set[Math.floor(Math.random() * set.length)])
				}

				if ((/[a-zA-Z]/).test(set)) {
					while (!(/[a-zA-Z]/).test(output[0])) {
						output = (set[Math.floor(Math.random() * set.length)]) + output.substring(1)
					}
				}

				return output
			}
			catch (error) {
				logError(error)
				return null
			}
		}

	/* chooseRandom */
		module.exports.chooseRandom = chooseRandom
		function chooseRandom(options) {
			try {
				if (!Array.isArray(options)) {
					return false
				}
				else {
					return options[Math.floor(Math.random() * options.length)]
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* sortRandom */
		module.exports.sortRandom = sortRandom
		function sortRandom(input) {
			try {
				// duplicate array
					var array = []
					for (var i in input) {
						array[i] = input[i]
					}

				// fisher-yates shuffle
					var x = array.length
					while (x > 0) {
						var y = Math.floor(Math.random() * x)
						x = x - 1
						var temp = array[x]
						array[x] = array[y]
						array[y] = temp
					}

				return array
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* locateIP */
		module.exports.locateIP = locateIP
		function locateIP(id, ip) {
			try {
				if (ip && ip.length >= 7) {
					var apiRequest = http.request({
						method: "POST",
						host: "www.ip-api.com",
						path: "/json/" + (ip || null),
					}, function (apiResponse) {
						var data = "";
						apiResponse.on("data", function (chunk) {
							data += chunk;
						});
						apiResponse.on("end", function() {
							data = JSON.parse(data);
							var activity = {
								time:    new Date().getTime(),
								org:     data.org || null,
								isp:     data.isp || null,
								city:    data.city || null,
								state:   data.regionName || null,
								country: data.country || null
							}

							var push = {}
								push.activity = activity
							var set = {}
								set["info.org"]     = data.org
								set["info.isp"]     = data.isp
								set["info.city"]    = data.city
								set["info.state"]   = data.regionName
								set["info.country"] = data.country
								set.updated         = new Date().getTime()

							storeData("sessions", {id: id}, {$push: push, $set: set}, {}, function (data) {
								logMessage("ip located")
							})
						})
					})
					
					apiRequest.write("")
					apiRequest.end()
				}
			}
			catch (error) {
				logError(error)
			}
		}

	/* sanitizeString */
		module.exports.sanitizeString = sanitizeString
		function sanitizeString(string) {
			try {
				return string.replace(/[^a-zA-Z0-9_\s\!\@\#\$\%\^\&\*\(\)\+\=\-\[\]\\\{\}\|\;\'\:\"\,\.\/\<\>\?]/gi, "")
			}
			catch (error) {
				logError(error)
				return ""
			}
		}

/*** database ***/
	/* determineSession */
		module.exports.determineSession = determineSession
		function determineSession(request, callback) {
			try {
				// new activity
					var activity = {}
					if (!request.post || request.post.action !== "fetchData") {
						activity.time = new Date().getTime()
						activity.url  = request.url
						activity.post = request.post ? request.post.action : null
					}

				// new session
					if (!request.cookie.session || request.cookie.session == null) {
						request.session = {
							id: generateRandom(),
							created: new Date().getTime(),
							updated: new Date().getTime(),
							info: {
								"ip":         request.ip,
								"user-agent": request.headers["user-agent"],
								"language":   request.headers["accept-language"],
								name:         isBot(request.headers["user-agent"]),
								org:          null,
								isp:          null,
								city:         null,
								state:        null,
								country:      null,
							},
							activity: [
								activity,
								{
									time:         new Date().getTime(),
									"ip":         request.ip,
									"user-agent": request.headers["user-agent"],
									"language":   request.headers["accept-language"],
								}
							]
						}

						storeData("sessions", null, request.session, {}, function (results) {
							locateIP(request.session.id, request.ip)
							callback()
						})
					}

				// existing session
					else {
						var push = {}
							push.activity = activity
						var set = {}
							set.updated = new Date().getTime()

						storeData("sessions", {id: request.cookie.session}, {$push: push, $set: set}, {}, function (result) {
							// invalid session id
								if (!result) {
									request.cookie.session = false
									determineSession(request, callback)
								}

							// new ip address
								else if (result.info.ip !== request.ip) {
									request.session = result

									var activity = {}
										activity.time =          new Date().getTime()
										activity["ip"] =         request.ip
										activity["user-agent"] = request.headers["user-agent"]
										activity["language"] =   request.headers["accept-language"]

									var push = {}
										push.activity = activity
									var set = {}
										set["info.ip"] = request.ip
										set["info.user-agent"] = request.headers["user-agent"]
										set["info.accept-language"] = request.headers["accept-language"]
										set.updated = new Date().getTime()

									storeData("sessions", {id: result.id}, {$push: push, $set: set}, {}, function (result) {
										locateIP(request.session.id, request.ip)
										callback()
									})
								}

							// others
								else {
									request.session = result
									callback()
								}
						})
					}
			}
			catch (error) {
				logError(error)
				callback()
			}
		}

	/* retrieveData */
		module.exports.retrieveData = retrieveData
		function retrieveData(collection, query, options, callback) {
			if (arguments.length !== 4) {
				logError("retrieve error: " + JSON.stringify(arguments))
			}

			//options
				var projection = options["$projection"] || {}
				var sample = options["$sample"] || false
				var project = options["$project"] || false
				var multi = options["$multi"] || false
				var sort = options["$sort"] || {created: -1}
				var limit = options["$limit"] || 100

			mongo.connect(database, { useNewUrlParser: true }, function(error, client) {
				var db = client.db("chalice")
				if (error) {
					logError(error)
					callback(null)
				}

			//aggregate with $match and $sample
				else if (sample) {
					// logMessage("aggregate: " + collection + ": " + JSON.stringify([{$match: query}, {$sample: sample}]))
					db.collection(collection).aggregate([{$match: query}, {$sample: sample}]).sort(sort).limit(limit).maxTimeMS(1000).toArray(function (error, resultArray) {
						if (error) {
							logError(error)
							callback(null)
						}
						else {
							if (resultArray.length === 0) {
								resultArray = null
							}
							callback(resultArray)
						}
						client.close()
					})
				}

			//aggregate with $match and $project
				else if (project) {
					// logMessage("aggregate: " + collection + ": " + JSON.stringify([{$match: query}, {$project: project}]))
					db.collection(collection).aggregate([{$match: query}, {$project: project}, {$sort: sort}, {$limit: limit}]).maxTimeMS(1000).toArray(function (error, resultArray) {
						if (error) {
							logError(error)
							callback(null)
						}
						else {
							if (resultArray.length === 0) {
								resultArray = null
							}
							callback(resultArray)
						}
						client.close()
					})
				}

			//findOne
				else if (!multi) {
					// logMessage("findOne: " + collection + ": " + JSON.stringify(query))
					db.collection(collection).findOne(query, projection, function (error, result) {
						if (error) {
							logError(error)
							callback(null)
						}
						else {
							callback(result)
						}
						client.close()
					})
				}

			//find
				else if (multi) {
					// logMessage("find: " + collection + ": " + JSON.stringify(query))
					db.collection(collection).find(query, projection).sort(sort).limit(limit).maxTimeMS(1000).toArray(function (error, resultArray) {
						if (error) {
							logError(error)
							callback(null)
						}
						else {
							if (resultArray.length === 0) {
								resultArray = null
							}
							callback(resultArray)
						}
						client.close()
					})
				}

			})
		}

	/* storeData */
		module.exports.storeData = storeData
		function storeData(collection, filter, data, options, callback) {
			if (arguments.length !== 5) {
				logError("store error: " + JSON.stringify(arguments))
			}

			//options
				var projection = options["$projection"] || {}
				var upsert = options["$upsert"] || false
				var multi = options["$multi"] || false
				var sort = options["$sort"] || {created: -1}
				var limit = options["$limit"] || 100

			mongo.connect(database, { useNewUrlParser: true }, function(error, client) {
				var db = client.db("chalice")
				if (error) {
					logError(error)
					callback(null)
				}

			//insert
				else if ((filter === null) && (data !== null)) {
					// logMessage("insert: " + collection + ":\n" + JSON.stringify(data))
					db.collection(collection).insert(data, function (error, result) {
						if (error) {
							logError(error)
							callback(false)
						}
						else {
							callback(result.nInserted)
						}
						client.close()
					})
				}

			//findOneAndUpdate
				else if ((filter !== null) && (data !== null) && (!multi)) {
					// logMessage("findOneAndUpdate: " + collection + ": " + JSON.stringify(filter) + ":\n" + JSON.stringify(data))
					db.collection(collection).updateOne(filter, data, {upsert: upsert, sort: sort, projection: projection}, function (error, result) {
						if (error) {
							logError(error)
							callback(null)
							client.close()
						}
						else {
							db.collection(collection).find(filter, projection).sort(sort).limit(limit).maxTimeMS(1000).toArray(function (error, resultArray) {
								if (error) {
									logError(error)
									callback(null)
								}
								else {
									if (resultArray.length === 0) {
										resultArray = null
									}
									callback(resultArray[0])
								}
								client.close()
							})
						}
					})
				}

			//update, then find
				else if ((filter !== null) && (data !== null) && (multi)) {
					// logMessage("update: " + collection + ": " + JSON.stringify(filter) + ":\n" + JSON.stringify(data))
					db.collection(collection).update(filter, data, {upsert: upsert, multi: true}, function (error, result) {
						if (error) {
							logError(error)
							callback(null)
						}
						else {
							db.collection(collection).find(filter, projection).sort(sort).limit(limit).maxTimeMS(1000).toArray(function (error, resultArray) {
								if (error) {
									logError(error)
									callback(null)
								}
								else {
									if (resultArray.length === 0) {
										resultArray = null
									}
									callback(resultArray)
								}
								client.close()
							})
						}
					})
				}

			//remove
				else if ((filter !== null) && (data === null)) {
					if (multi) { multi = true }

					// logMessage("remove: " + collection + ": " + JSON.stringify(filter))
					db.collection(collection).remove(filter, !multi, function (error, result) {
						if (error) {
							logError(error)
							callback(false)
						}
						else {
							callback(result.nRemoved)
						}
						client.close()
					})
				}

			})
		}
