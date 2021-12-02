/*** modules ***/
	var main = require("../main/logic")
	module.exports = {}

/*** fetches ***/
	/* fetchData */
		module.exports.fetchData = fetchData
		function fetchData(request, callback) {
			try {
				if (!request.post) {
					callback({success: false, message: "not a valid fetch request"})
				}
				else {
					main.retrieveData("games", {id: request.path[2].toLowerCase()}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else {
							callback({success: true, game: games[0]})
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to fetch data"})
			}
		}

/*** submits ***/
	/* submitName */
		module.exports.submitName = submitName
		function submitName(request, callback) {
			try {
				if (!request.post) {
					callback({success: false, message: "invalid input"})
				}
				else {
					main.retrieveData("games", {id: request.path[2].toLowerCase()}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else if (games[0].state.end) {
							callback({success: false, message: "game already ended"})
						}
						else if (!games[0].spots[request.session.id]) {
							callback({success: false, message: "not a player of this game"})
						}
						else if (!request.post.name || request.post.name.length < 4 || request.post.name.length > 16) {
							callback({success: false, message: "name must be 4 - 16 letters and numbers"})
						}
						else {
							request.game = games[0]
							request.player = request.game.spots[request.session.id]
							request.player.name = main.sanitizeString(request.post.name)

							// update
								var set = {}
									set.updated = new Date().getTime()
									set["spots." + request.player.id + ".name"] = request.player.name

								main.storeData("games", {id: request.game.id}, {$set: set}, {}, function (game) {
									if (!game) {
										callback({success: false, message: "unable to update name"})
									}
									else {
										callback({success: true, message: "name updated", name: request.player.name})
									}
								})
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to submit name"})
			}
		}

	/* submitMove */
		module.exports.submitMove = submitMove
		function submitMove(request, callback) {
			try {
				if (!request.post || !request.post.card) {
					callback({success: false, message: "no card selected"})
				}
				else if (!["cards", "cups", "immunities"].includes(request.post.target.split("-")[1])) {
					callback({success: false, message: "invalid target"})
				}
				else {
					main.retrieveData("games", {id: request.path[2].toLowerCase()}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else if (games[0].state.end) {
							callback({success: false, message: "game already ended"})
						}
						else if (!games[0].spots[request.session.id]) {
							callback({success: false, message: "not a player of this game"})
						}
						else if ((games[0].state.turn !== request.session.id) && (!games[0].spots[request.session.id].king || games[0].state.turn) && games[0].spots[request.session.id].active) {
							callback({success: false, message: "not your turn"})
						}
						else if (Object.keys(games[0].spots).filter(function (p) { return games[0].spots[p].debt }).length && !games[0].spots[request.session.id].debt) {
							callback({success: false, message: "waiting on opponent to discard cards"})
						}
						else {
							request.game   = games[0]
							request.player = request.game.spots[request.session.id]

							locateMove(request, callback)
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to play card"})
			}
		}

	/* submitBegin */
		module.exports.submitBegin = submitBegin
		function submitBegin(request, callback) {
			try {
				if (!request.post) {
					callback({success: false, message: "invalid selection"})
				}
				else {
					main.retrieveData("games", {id: request.path[2].toLowerCase()}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else if (games[0].state.end) {
							callback({success: false, message: "game already ended"})
						}
						else if (!games[0].spots[request.session.id]) {
							callback({success: false, message: "not a player of this game"})
						}
						else if (!games[0].state.begin) {
							callback({success: false, message: "not ready to begin the round"})
						}
						else {
							request.game   = games[0]
							request.player = request.game.spots[request.session.id]

							beginRound(request, callback)
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to play card"})
			}
		}

/*** move sequence ***/
	/* locateMove */
		module.exports.locateMove = locateMove
		function locateMove(request, callback) {
			try {
				request.card   = null
				request.origin = null
				request.target = request.post.target.split("-")

				// check all spots
					if (!request.card || !request.origin) {
						var ids = Object.keys(request.game.spots)

						for (var i = 0; i < ids.length; i++) {
							if (!request.card || !request.origin) {
								for (var j = 0; j < request.game.spots[ids[i]].cards.length; j++) {
									if (request.game.spots[ids[i]].cards[j].id == request.post.card) {
										request.card = request.game.spots[ids[i]].cards[j]
										request.origin = [ids[i], "cards"]
										break
									}
								}
							}

							if (!request.card || !request.origin) {
								for (var j = 0; j < request.game.spots[ids[i]].cups.length; j++) {
									if (request.game.spots[ids[i]].cups[j].id == request.post.card) {
										request.card = request.game.spots[ids[i]].cups[j]
										request.origin = [ids[i], "cups"]
										break
									}
								}
							}

							if (!request.card || !request.origin) {
								if (request.game.spots[ids[i]].immunities) { // players only
									for (var j = 0; j < request.game.spots[ids[i]].immunities.length; j++) {
										if (request.game.spots[ids[i]].immunities[j].id == request.post.card) {
											request.card = request.game.spots[ids[i]].immunities[j]
											request.origin = [ids[i], "immunities"]
											break
										}
									}
								}
							}
						}
					}

				// move card
					if (!request.card) {
						callback({success: false, message: "unable to find card"})
					}
					else if (!request.origin || !request.game.spots[request.origin[0]] || !request.game.spots[request.origin[0]][request.origin[1]]) {
						callback({success: false, message: "unable to find origin"})
					}
					else if (!request.target || !request.game.spots[request.target[0]] || !request.game.spots[request.target[0]][request.target[1]]) {
						callback({success: false, message: "unable to find target"})
					}
					else {
						identifyMove(request, callback)
					}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to identify move"})
			}
		}

	/* identifyMove */
		module.exports.identifyMove = identifyMove
		function identifyMove(request, callback) {
			try {
				var activeRight = getActiveOpponents(request, "right")
				var activeLeft  = getActiveOpponents(request, "left")
				var allPlayers  = getAllPlayers(request, "left")

				// no move
					if ((request.origin[0] == request.target[0]) && (request.origin[1] == request.target[1])) {
						callback({success: false, message: "no move"})
					}

				// king
					else if ((request.game.state.turn == request.player.id) && (request.player.king)) {
						// distribute
							if ((request.origin[0] == "table") && (request.origin[1] == "cups") && (getAllPlayers(request).includes(request.target[0])) && (request.target[1] == "cups") && !request.game.spots[request.target[0]].cups.length) {
								request.move = "kingdistribute"
								enactMove(request, callback) // distributing cups while king
							}
							else if ((request.origin[0] == "table") && (request.origin[1] == "cards") && (request.card.form == "cup") && (request.target[0] == "table") && (request.target[1] == "cups")) {
								request.move = "kingpredistribute"
								enactMove(request, callback) // moving from cards to cups while king
							}

						// others
							else {
								callback({success: false, message: "illegal move"})
							}
					}

				// post drink
					else if (!request.player.active) {
						// ending turn
							if (request.player.debt && (request.origin[0] == request.player.id) && (request.target[0] == "pile") && (request.target[1] == "cards")) {
								request.move = "discarddead"
								enactMove(request, callback) // discarding a card while poisoned
							}
							else if (request.game.state.acted && (request.origin[0] == "table") && (request.origin[1] == "cards") && (request.card.form == "cup") && (request.target[0] == request.player.id) && (request.target[1] == "cups") && (!request.player.debt)) {
								request.move = "cupend"
								enactMove(request, callback) // returning cup to deactivate
							}

						// drinkall
							else if ((request.player.id == request.game.state.turn) && !request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "drinkall") && (request.origin[0] == request.player.id || activeLeft.includes(request.origin[0])) && (request.origin[1] == "cups") && (request.card.form == "cup") && (request.target[0] == "table") && (request.target[1] == "cards")) {
								request.move = "drinkall"
								enactMove(request, callback) // make a player drink (all)
							}
							else if ((request.player.id == request.game.state.turn) && !request.game.state.acted && (request.origin[0] == "table") && (request.origin[1] == "cards") && (request.card.form == "cup") && allPlayers.includes(request.target[0]) && (request.target[1] == "cups") && !request.game.spots[request.target[0]].cups.length && !request.game.spots[request.target[0]].debt) {
								request.move = "cupback"
								enactMove(request, callback) // returning cup to opponent after drinkup / drinkall
							}
							else if ((request.player.id == request.game.state.turn) && (request.origin[0] == "table") && (request.origin[1] == "cards") && (request.card.form == "card") && (request.target[0] == "pile") && (request.target[1] == "cards") && !request.game.spots.table.cups.length && (request.game.spots.table.cards.length == 1) && (request.card.type.replace(/\s/g, "") !== "drinkall" || (!request.player.active && !activeLeft.length))) {
								request.move = "discardend"
								enactMove(request, callback) // discarding action to end turn
							}

						// others
							else {
								callback({success: false, message: "illegal move"})
							}
					}

				// actions
					else if ((request.player.id == request.game.state.turn) && request.player.active) {
						// play a card or cup
							if (!request.game.state.acted && (request.origin[0] == request.player.id) && (request.origin[1] == "cards") && (request.target[0] == "table") && (request.target[1] == "cards") && !request.game.spots.table.cards.length && !request.game.spots.table.cups.length) {
								request.move = "play"
								enactMove(request, callback) // playing a card while none are played
							}
							else if (!request.game.state.acted && (request.origin[0] == request.player.id) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cards") && !request.game.spots.table.cards.length && !request.game.spots.table.cups.length) {
								request.move = "drink"
								enactMove(request, callback) // playing a cup while none are played
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "drinkup") && activeLeft.includes(request.origin[0]) && (request.origin[1] == "cups") && (request.card.form == "cup") && (request.target[0] == "table") && (request.target[1] == "cards")) {
								request.move = "drinkup"
								enactMove(request, callback) // make another player drink
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "drinkall") && (request.origin[0] == request.player.id || activeLeft.includes(request.origin[0])) && (request.origin[1] == "cups") && (request.card.form == "cup") && (request.target[0] == "table") && (request.target[1] == "cards")) {
								request.move = "drinkall"
								enactMove(request, callback) // make a player drink (all)
							}

						// move a card
							else if (!request.game.state.acted && (request.origin[0] == "table") && (request.origin[1] == "cards") && (request.target[0] == request.player.id) && (request.target[1] == "immunities") && (request.card.type.replace(/\s/g, "").includes("immunity") || request.card.type.replace(/\s/g, "").includes("miracle"))) {
								request.move = "immunity"
								enactMove(request, callback) // moving an immunity or miracle from the table into the immunities section
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type == "steal") && (request.origin[0] !== request.player.id) && (request.card.form == "card") && allPlayers.includes(request.origin[0]) && (request.origin[1] == "cards") && (request.target[0] == request.player.id) && (request.target[1] == "cards")) {
								request.move = "stealcard"
								enactMove(request, callback) // stealing a card from hand to hand
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type == "steal") && (request.origin[0] !== request.player.id) && (request.card.form == "card") && allPlayers.includes(request.origin[0]) && (request.origin[1] == "immunities") && (request.target[0] == request.player.id) && (request.target[1] == "immunities")) {
								request.move = "stealimmunity"
								enactMove(request, callback) // stealing a card from immunities to immunities
							}

						// move a cup to look
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "look") && (request.card.form == "cup") && allPlayers.includes(request.origin[0]) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cups") && !request.game.spots.table.cups.length) {
								request.move = "look"
								enactMove(request, callback) // look at a cup
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchany") && (request.card.form == "cup") && activeLeft.includes(request.origin[0]) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cups") && !request.game.spots.table.cups.length) {
								request.move = "lookswitchany"
								enactMove(request, callback) // switch any - look
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchleft") && (request.card.form == "cup") && (request.origin[0] == activeLeft[0]) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cups") && !request.game.spots.table.cups.length) {
								request.move = "lookswitchleft"
								enactMove(request, callback) // switch left - look
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchright") && (request.card.form == "cup") && (request.origin[0] == activeRight[0]) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cups") && !request.game.spots.table.cups.length) {
								request.move = "lookswitchright"
								enactMove(request, callback) // switch right - look
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchclockwise") && (request.card.form == "cup") && (request.origin[0] == activeRight[0]) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cups") && !request.game.spots.table.cups.length) {
								request.move = "lookswitchclockwise"
								enactMove(request, callback) // switch cw - look
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchcounterclockwise") && (request.card.form == "cup") && (request.origin[0] == activeLeft[0]) && (request.origin[1] == "cups") && (request.target[0] == "table") && (request.target[1] == "cups") && !request.game.spots.table.cups.length) {
								request.move = "lookswitchcounterclockwise"
								enactMove(request, callback) // switch ccw - look
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "redistribute") && (request.origin[0] == request.player.id || activeLeft.includes(request.origin[0])) && (request.origin[1] == "cups") && (request.card.form == "cup") &&  (request.target[0] == "table") && (request.target[1] == "cups")) {
								request.move = "lookredistribute"
								enactMove(request, callback) // redistribute - look
							}

						// move a card from look
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "look") && (request.card.form == "cup") && (request.origin[0] == "table") && (request.origin[1] == "cups") && allPlayers.includes(request.target[0]) && (request.target[1] == "cups") && !request.game.spots[request.target[0]].cups.length) {
								request.move = "unlook"
								enactMove(request, callback) // put cup back
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchany") && (request.card.form == "cup") && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.target[0] == request.player.id) && (request.target[1] == "cups")) {
								request.move = "switchany"
								enactMove(request, callback) // switch any
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchleft") && (request.card.form == "cup") && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.target[0] == request.player.id) && (request.target[1] == "cups")) {
								request.move = "switchleft"
								enactMove(request, callback) // switch left
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchright") && (request.card.form == "cup") && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.target[0] == request.player.id) && (request.target[1] == "cups")) {
								request.move = "switchright"
								enactMove(request, callback) // switch right
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchclockwise") && (request.card.form == "cup") && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.target[0] == request.player.id) && (request.target[1] == "cups")) {
								request.move = "switchclockwise"
								enactMove(request, callback) // switch cw
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "switchcounterclockwise") && (request.card.form == "cup") && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.target[0] == request.player.id) && (request.target[1] == "cups")) {
								request.move = "switchcounterclockwise"
								enactMove(request, callback) // switch ccw
							}
							else if (!request.game.state.acted && request.game.spots.table.cards.length && (request.game.spots.table.cards[0].type.replace(/\s/g, "") == "redistribute") && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.target[0] == request.player.id || activeLeft.includes(request.target[0])) && (request.target[1] == "cups") && !request.game.spots[request.target[0]].cups.length) {
								request.move = "redistribute"
								enactMove(request, callback) // redistribute
							}

						// return cup
							else if (!request.game.state.acted && request.game.spots.table.cards.length && ["switchany", "switchleft", "switchright", "switchclockwise", "switchcounterclockwise"].includes(request.game.spots.table.cards[0].type.replace(/\s/g, "")) && (request.origin[0] == "table") && (request.origin[1] == "cups") && (request.card.form == "cup") && activeLeft.includes(request.target[0]) && (request.target[1] == "cups") && !request.game.spots[request.target[0]].cups.length) {
								request.move = "cancelswitch"
								enactMove(request, callback) // cancel switch
							}
							else if (!request.game.state.acted && (request.origin[0] == "table") && (request.origin[1] == "cards") && (request.card.form == "cup") && allPlayers.includes(request.target[0]) && (request.target[1] == "cups") && !request.game.spots[request.target[0]].cups.length && !request.game.spots[request.target[0]].debt) {
								request.move = "cupback"
								enactMove(request, callback) // returning cup to opponent after drinkup / drinkall
							}

						// end turn
							else if ((request.origin[0] == "table") && (request.origin[1] == "cards") && (request.card.form == "card") && (request.target[0] == "pile") && (request.target[1] == "cards") && !request.game.spots.table.cups.length && (request.game.spots.table.cards.length == 1)) {
								request.move = "discardend"
								enactMove(request, callback) // discarding action to end turn
							}
							
						// others
							else {
								callback({success: false, message: "illegal move"})
							}
					}

				// others
					else {
						callback({success: false, message: "illegal move"})
					}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to try move"})
			}
		}

	/* enactMove */
		module.exports.enactMove = enactMove
		function enactMove(request, callback) {
			try {
				// enact action
					switch (request.move) {
						// play card
							case "play":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " plays " + request.card.type
								request.game.state.acted = false
							break

						// look
							case "unlook":
							case "look":
							case "lookswitchany":
							case "lookswitchleft":
							case "lookswitchright":
							case "lookswitchclockwise":
							case "lookswitchcounterclockwise":
							case "lookredistribute":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
							break

						// switch
							case "cancelswitch":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " does not switch cups"
								request.game.state.acted = true
							break

							case "switchany":
							case "switchleft":
							case "switchright":
								var opponent = getActiveOpponents(request).find(function (o) {
									return !request.game.spots[o].cups.length
								})

								completeMove(request.player.cups[0], request.game.spots[request.player.id].cups, request.game.spots[opponent].cups)
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " switches cups with " + (request.game.spots[opponent].name || "player " + request.game.spots[opponent].seat)
								request.game.state.acted = true
							break

							case "switchclockwise":
								var players = [request.player.id]
									players = players.concat(getActiveOpponents(request, "left"))

								for (var i = 0; i < players.length - 1; i++) {
									completeMove(request.game.spots[players[i]].cups[0], request.game.spots[players[i]].cups, request.game.spots[players[i + 1]].cups)	
								}
								completeMove(request.card, request.game.spots.table.cups, request.player.cups)

								request.game.state.status = (request.player.name || "player " + request.player.seat) + " switches cups clockwise"
								request.game.state.acted = true
							break

							case "switchcounterclockwise":
								var players = [request.player.id]
									players = players.concat(getActiveOpponents(request, "right"))

								for (var i = 0; i < players.length - 1; i++) {
									completeMove(request.game.spots[players[i]].cups[0], request.game.spots[players[i]].cups, request.game.spots[players[i + 1]].cups)	
								}
								completeMove(request.card, request.game.spots.table.cups, request.player.cups)

								request.game.state.status = (request.player.name || "player " + request.player.seat) + " switches cups counterclockwise"
								request.game.state.acted = true
							break

						// immunity
							case "immunity":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])

								var opponents = getActiveOpponents(request, "left")
								request.game.state.turn = opponents[0] || request.session.id
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " ends turn; " + (request.game.spots[request.game.state.turn].name || "player " + request.game.spots[request.game.state.turn].seat) + "'s turn"
								request.game.state.acted = false

								if (isRoundEnd(request)) {
									request.game.state.status = "the round ends"
									request.game.state.begin = true
								}
							break

						// steal
							case "stealimmunity":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])

								request.game.state.status = (request.player.name || "player " + request.player.seat) + " now has " + request.card.type + ", stolen from " + (request.game.spots[request.origin[0]].name || "player " + request.game.spots[request.origin[0]].seat)
								request.game.state.acted = true
							break

							case "stealcard":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])

								request.game.state.status = (request.player.name || "player " + request.player.seat) + " stole a card from " + (request.game.spots[request.origin[0]].name || "player " + request.game.spots[request.origin[0]].seat)
								request.game.state.acted = true
							break

						// distribute
							case "kingpredistribute":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
							break

							case "kingdistribute":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								request.game.spots[request.target[0]].active = true
								
								var opponents = getActiveOpponents(request, "left")
								if (request.player.cups.length && (getAllPlayers(request).length == opponents.length + 1)) {
									request.player.king = false

									request.game.state.turn = opponents[0]
									request.game.state.status = (request.player.name || "player " + request.player.seat) + " has distributed the cups; " + (request.game.spots[request.game.state.turn].name || "player " + request.game.spots[request.game.state.turn].seat) + "'s turn"
									request.game.state.acted = false
								}
							break

							case "redistribute":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])

								var opponents = getActiveOpponents(request, "left")
								if (request.player.cups.length && !request.game.spots.table.cups.length && !opponents.filter(function (o) { return !request.game.spots[o].cups.length }).length) {
									request.game.state.status = (request.player.name || "player " + request.player.seat) + " has redistributed the cups"
									request.game.state.acted = true
								}
							break

						// drinkup / drinkall
							case "drinkup":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								var type = resolveDrink(request.card, request.game.spots[request.origin[0]], request)

								request.game.state.status = (request.player.name || "player " + request.player.seat) + " makes " + (request.game.spots[request.origin[0]].name || "player " + request.game.spots[request.origin[0]].seat) + " drink " + request.card.type + (type == request.card.type.replace(/\s/g, "") ? "" : ", which becomes " + type) + (request.game.spots[request.origin[0]].debt ? "; discard " + request.game.spots[request.origin[0]].debt : "")
							break

							case "drinkall":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								var type = resolveDrink(request.card, request.game.spots[request.origin[0]], request)

								request.game.state.status = (request.player.name || "player " + request.player.seat) + " makes " + (request.game.spots[request.origin[0]].name || "player " + request.game.spots[request.origin[0]].seat) + " drink " + request.card.type + (type == request.card.type.replace(/\s/g, "") ? "" : ", which becomes " + type) + (request.game.spots[request.origin[0]].debt ? "; discard " + request.game.spots[request.origin[0]].debt : "")
							break

							case "cupback":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								if (!getActiveOpponents(request).length && !request.player.active) {
									request.game.state.acted = true
								}
							break

						// discard
							case "discarddead":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								request.game.state.status = (request.game.spots[request.origin[0]].name || "player " + request.game.spots[request.origin[0]].seat) + " discards " + request.card.type
								request.player.debt--
							break

							case "discardend":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								var opponents = getActiveOpponents(request, "left")
								request.game.state.turn = opponents[0] || request.session.id
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " ends turn; " + (request.game.spots[request.game.state.turn].name || "player " + request.game.spots[request.game.state.turn].seat) + "'s turn"
								request.game.state.acted = false

								if (isRoundEnd(request)) {
									request.game.state.status = "the round ends"
									request.game.state.begin = true
								}
							break

						// drink
							case "drink":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								var type = resolveDrink(request.card, request.player, request)
								
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " drinks " + request.card.type + (type == request.card.type.replace(/\s/g, "") ? "" : ", which becomes " + type) + (request.game.spots[request.origin[0]].debt ? "; discard " + request.game.spots[request.origin[0]].debt : "")
								request.game.state.acted = true
							break

							case "cupend":
								completeMove(request.card, request.game.spots[request.origin[0]][request.origin[1]], request.game.spots[request.target[0]][request.target[1]])
								var opponents = getActiveOpponents(request, "left")
								request.game.state.turn = opponents[0] || request.session.id
								request.game.state.status = (request.player.name || "player " + request.player.seat) + " ends turn; " + (request.game.spots[request.game.state.turn].name || "player " + request.game.spots[request.game.state.turn].seat) + "'s turn"
								request.game.state.acted = false

								if (isRoundEnd(request)) {
									request.game.state.status = "the round ends"
									request.game.state.begin = true
								}
							break

						// others
							default:
								request.move = false
								callback({success: false, message: "unknown move"})
							break
					}

				// update data
					if (request.move) {
						request.game.updated = new Date().getTime()

						main.storeData("games", {id: request.game.id}, {$set: request.game}, {}, function (game) {
							if (!game) {
								callback({success: false, message: "unable to save game data"})
							}
							else {
								callback({success: true, game: request.game})
							}
						})
					}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to complete move"})
			}
		}

	/* completeMove */
		module.exports.completeMove = completeMove
		function completeMove(card, before, after) {
			try {
				// remove from before
					var index = before.indexOf(card)
					before.splice(index, 1)

				// add to after
					after.push(card)
			}
			catch (error) {
				main.logError("unable to complete move: " + error)
			}
		}

/*** new round ***/
	/* beginRound */
		module.exports.beginRound = beginRound
		function beginRound(request, callback) {
			try {
				request.game.state.begin = false
				request.game.state.acted = false
				var allPlayers = getAllPlayers(request, "left")

				// first round
					if (!request.game.state.round) {
						request.game.state.start = new Date().getTime()
						request.game.state.round = 1						

						// deal 4 cards and 1 cup each
							allPlayers = main.sortRandom(allPlayers)
							for (var i = 0; i < allPlayers.length; i++) {
								completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, request.game.spots[allPlayers[i]].cards)
								completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, request.game.spots[allPlayers[i]].cards)
								completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, request.game.spots[allPlayers[i]].cards)
								completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, request.game.spots[allPlayers[i]].cards)

								completeMove(request.game.spots.table.cards[0],request.game.spots.table.cards,request.game.spots[allPlayers[i]].cups)
							}

						// choose random player to begin
							allPlayers = main.sortRandom(allPlayers)
							request.game.state.turn = allPlayers[0]
					}

				// subsequent rounds
					else {
						// clear cups
							for (var i = 0; i < allPlayers.length; i++) {
								if (request.game.spots[allPlayers[i]].cups.length) {
									request.game.spots[allPlayers[i]].cups[0].face = "back"

									if (request.game.spots[allPlayers[i]].cups[0].type.replace(/\s/g, "") == "royalwine") {
										request.game.spots[allPlayers[i]].king = true
										completeMove(request.game.spots[allPlayers[i]].cups[0], request.game.spots[allPlayers[i]].cups, request.game.spots.table.cards)
									}
									else {
										completeMove(request.game.spots[allPlayers[i]].cups[0], request.game.spots[allPlayers[i]].cups, request.game.spots.pile.cups)
									}
								}
							}

						// game end
							var victors = isGameEnd(request) || []
							if (victors.length) {
								request.game.state.end = new Date().getTime()
								request.game.state.turn = null
								request.game.state.victor.id   = []
								request.game.state.victor.name = []

								for (var i = 0; i < victors.length; i++) {
									request.game.state.victor.id.push(victors[i].id)
									request.game.state.victor.name.push(victors[i].name)
								}
							}

						// new round
							else {
								request.game.state.round += 1

								// deal cards if possible
									if (allPlayers.length > request.game.spots.deck.cards.length) {
										shufflePile(request, "cards")
									}

									if (allPlayers.length <= request.game.spots.deck.cards.length) {
										for (var i = 0; i < allPlayers.length; i++) {
											completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, request.game.spots[allPlayers[i]].cards)
										}
									}

								// move cups to center
									if (allPlayers.length - 1 > request.game.spots.deck.cups.length) {
										shufflePile(request, "cups")
									}

									for (var i = 0; i < allPlayers.length - 1; i++) {
										completeMove(request.game.spots.deck.cups[0], request.game.spots.deck.cups, request.game.spots.table.cards)
									}

								// king's turn
									var king = allPlayers.find(function (p) {
										return request.game.spots[p].king
									})
									request.game.state.turn = king
									request.game.state.status = (request.game.spots[king].name || ("player " + request.game.spots[king].seat)) + " distributes the cups"
							}
					}

				// update data
					request.game.updated = new Date().getTime()

					main.storeData("games", {id: request.game.id}, {$set: request.game}, {}, function (game) {
						if (!game) {
							callback({success: false, message: "unable to save game data"})
						}
						else {
							callback({success: true, game: request.game})
						}
					})
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to begin round"})
			}
		}

/*** helpers ***/
	/* getAllPlayers */
		module.exports.getAllPlayers = getAllPlayers
		function getAllPlayers(request, direction) {
			try {
				// start at self
					var all = Object.keys(request.game.spots).filter(function (s) { return !["table", "deck", "pile"].includes(s) })
					var playerCount = all.length
					if (request.game.spots[request.session.id]) {
						var seat = request.game.spots[request.session.id].seat
					}
					else {
						var seat = 0
					}

					var start = seat
					var players = []
				
				// loop through all players
					do {
						if (direction == "right") {
							seat = (seat ? seat - 1 : playerCount - 1)
						}
						else {
							seat = (seat < playerCount - 1 ? seat + 1 : 0)
						}

						var id = all.find(function (p) {
							return request.game.spots[p].seat == seat
						})
						
						players.push(id)
					}
					while (seat !== start)

				// return
					return players
			}
			catch (error) {
				main.logError(error)
			}
		}

	/* getActiveOpponents */
		module.exports.getActiveOpponents = getActiveOpponents
		function getActiveOpponents(request, direction) {
			try {
				// start at self
					var all = Object.keys(request.game.spots).filter(function (s) { return !["table", "deck", "pile"].includes(s) })
					var playerCount = all.length
					var seat = request.game.spots[request.session.id].seat
					var opponents = []
				
				// loop through opponents
					do {
						if (direction == "right") {
							seat = (seat ? seat - 1 : playerCount - 1)
						}
						else {
							seat = (seat < playerCount - 1 ? seat + 1 : 0)
						}

						if (seat !== request.game.spots[request.session.id].seat) {
							var id = all.find(function (p) {
								return request.game.spots[p].seat == seat
							})
							
							if (request.game.spots[id].active) {
								opponents.push(id)
							}
						}
					}
					while (seat !== request.game.spots[request.session.id].seat)

				// return
					return opponents
			}
			catch (error) {
				main.logError(error)
			}
		}

	/* resolveDrink */
		module.exports.resolveDrink = resolveDrink
		function resolveDrink(cup, player, request) {
			// get data
				var type = cup.type.replace(/\s/g, "")
				
				var immunities = []
				for (var i = 0; i < player.immunities.length; i++) {
					immunities.push(player.immunities[i].type.replace(/\s/g, "").replace("immunity", "").replace("miracle", "water"))
				}

			// poisons
				if (["nightshade", "cyanide", "hemlock", "arsenic"].includes(type)) {
					if (immunities.includes(type)) {
						type = "water"
					}
					else {
						cup.face = "front"
						player.debt = Math.floor(player.cards.length / 2) || 0
						player.active = false
					}
				}

			// neutrals
				if (["water"].includes(type)) {
					if (immunities.includes(type)) {
						type = "wine"
					}
					else {
						cup.face = "front"
						player.active = false
					}
				}

			// wines
				if (["wine", "royalwine"].includes(type)) {
					cup.face = "front"
					player.active = false

					if (request.game.spots.deck.cards.length < 2) {
						shufflePile(request, "cards")
					}

					if (request.game.spots.deck.cards.length) {
						completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, player.cards)
					}
					if (request.game.spots.deck.cards.length) {
						completeMove(request.game.spots.deck.cards[0], request.game.spots.deck.cards, player.cards)
					}
				}

			// return values
				return type
		}

	/* isRoundEnd */
		module.exports.isRoundEnd = isRoundEnd
		function isRoundEnd(request) {
			var players = getActiveOpponents(request)
			if (request.player.active) {
				players.push(request.player.id)
			}

			if (players.length) {
				return false
			}
			else {
				return true
			}
		}

	/* isGameEnd */
		module.exports.isGameEnd = isGameEnd
		function isGameEnd(request) {
			var ids = getAllPlayers(request)
			var targetCount = 14 - ids.length + (ids.length == 3 ? 1 : 0)

			var victors = []
			for (var i = 0; i < ids.length; i++) {
				if (request.game.spots[ids[i]].cards.length >= targetCount) {
					victors.push(request.game.spots[ids[i]])
				}
			}

			if (!victors.length) {
				return false
			}
			else {
				victors = victors.sort(function (a, b) {
					return a.cards.length < b.cards.length
				})

				var winCount = victors[0].cards.length

				victors = victors.filter(function (v) {
					return v.cards.length == winCount
				})

				return victors
			}
		}

	/* shufflePile */
		module.exports.shufflePile = shufflePile
		function shufflePile(request, form) {
			try {
				var pile = request.game.spots.pile[form]
				var deck = request.game.spots.deck[form]

				pile = main.sortRandom(pile)
				pile = main.sortRandom(pile)
				pile = main.sortRandom(pile)
				deck = deck.concat(pile)

				request.game.spots.deck[form] = deck
				request.game.spots.pile[form] = []
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to shuffle pile"})
			}
		}
