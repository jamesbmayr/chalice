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
					main.retrieveData("games", {$where: "this.id.substring(0,4) === '" + request.path[2].toLowerCase() + "'"}, {$multi: true}, function (games) {
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
					main.retrieveData("games", {$where: "this.id.substring(0,4) === '" + request.path[2].toLowerCase() + "'"}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else if (games[0].state.end) {
							callback({success: false, message: "game already ended"})
						}
						else if (!games[0].players[request.session.id]) {
							callback({success: false, message: "not a player of this game"})
						}
						else if (!request.post.name || request.post.name.length < 4 || request.post.name.length > 16) {
							callback({success: false, message: "name must be 4 - 16 letters and numbers"})
						}
						else {
							request.game = games[0]
							request.player = request.game.players[request.session.id]
							request.player.name = main.sanitizeString(request.post.name)

							// update
								var set = {}
									set.updated = new Date().getTime()
									set["players." + request.player.id + ".name"] = request.player.name

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
		}

	/* submitCard */
		module.exports.submitCard = submitCard
		function submitCard(request, callback) {
			try {
				if (!request.post) {
					callback({success: false, message: "no card selected"})
				}
				else {
					main.retrieveData("games", {$where: "this.id.substring(0,4) === '" + request.path[2].toLowerCase() + "'"}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else if (games[0].state.end) {
							callback({success: false, message: "game already ended"})
						}
						else if (!games[0].players[request.session.id]) {
							callback({success: false, message: "not a player of this game"})
						}
						else {
							request.game = games[0]
							request.player = request.game.players[request.session.id]
							request.card = request.player.cards.find(function(c) {
								return c.id == request.post.card
							}) || request.player.cups.find(function(c) {
								return c.id == request.post.card
							}) || null

							if (!card) {
								callback({success: false, message: "not your card"})
							}
							else if (request.card.form == "cup") {
								if (request.card.face == "front") {
									callback({success: false, message: "unable to drink cup"})
								}
								else {
									// update data
										drinkCup(request.card, request.player, request)
										request.game.table.active = []
										request.game.updated = new Date().getTime()

									// store data
										main.storeData("games", {id: request.game.id}, game, {}, function (game) {
											if (!game) {
												callback({success: false, message: "unable to save game data"})
											}
											else {
												callback({success: true, game: request.game})
											}
										})
								}
							}
							else if (request.card.form == "card") {
								switch (request.card.type.replace(/\s/g,"")) {
									case "arsenicimmunity":
									case "cyanideimmunity":
									case "hemlockimmunity":
									case "nightshadeimmunity":
									case "miracle":
										// update data
											moveCard(request.card.id, request.player.cards, request.player.immunities)
											request.game.table.active = [request.card]
											request.game.updated = new Date().getTime()

										// store data
											main.storeData("games", {id: request.game.id}, game, {}, function (game) {
												if (!game) {
													callback({success: false, message: "unable to save game data"})
												}
												else {
													callback({success: true, game: request.game})
												}
											})
									break

									case "switchright":
									case "switchclockwise":
										var cups = getCups(request, "right")
										if (!cups) {
											callback({sucess: false, message: "no one to switch with"})
										}
										else {
											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.table.cups = [cups[0]]
												request.game.table.prompt = "complete the switch?"
												request.game.updated = new Date().getTime()
										
											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, confirmation: true})
													}
												})
										}
									break

									case "switchleft":
									case "switchcounterclockwise":
										var cups = getCups(request, "left")		
										if (!cups) {
											callback({sucess: false, message: "no one to switch with"})
										}
										else {
											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.table.cups = [cups[0]]
												request.game.table.prompt = "complete the switch?"
												request.game.updated = new Date().getTime()
										
											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, confirmation: true})
													}
												})
										}
									break

									case "switchany":
									case "drinkup":
										var cups = getCups(request)
										if (!cups) {
											callback({success: false, message: "no one has cups"})
										}
										else {
											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.table.prompt = "select an opponent cup"
												request.game.updated = new Date().getTime()

											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, selection: true})
													}
												})
										}
									break

									case "steal":
										var hands = getHands(request)
										if (!hands) {
											callback({success: false, message: "no one has cards"})
										}
										else {
											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.table.prompt = "select an opponent card"
												request.game.updated = new Date().getTime()

											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, selection: true})
													}
												})
										}
									break

									case "look":
										var cups = getCups(request)
										if (!cups) {
											callback({success: false, message: "no one has cups"})
										}
										else {
											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.table.cups = cups
												request.game.updated = new Date().getTime()

											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, confirmation: true})
													}
												})
										}
									break

									case "drinkall":
										var cups = getCups(request)
										if (!cups) {
											callback({success: false, message: "no one has cups"})
										}
										else {
											// drink own cup
												drinkCup(request.player.cups[0], request.game.player, request)

											// make opponents drink cups
												var opponents = getOpponents(request)
												for (var i = 0; i < cups.length; i++) {
													if (cups[i].face == "back") {
														drinkCup(cups[i], opponents[i], request)
													}
												}

											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.updated = new Date().getTime()

											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, confirmation: true})
													}
												})
										}
									break

									case "redistribute":
										var cups = getCups(request)
										if (!cups) {
											callback({success: false, message: "no one has cups"})
										}
										else {
											// move cups to center
												moveCard(request.player.cups[0], request.player.cups, request.game.table.cups)

												var opponents = getOpponents(request)
												for (var i = 0; i < cups.length; i++) {
													if (cups[i].face == "back") {
														moveCard(cups[i], opponents[i], request.game.table.cups)
													}
												}

											// update data
												moveCard(request.card.id, request.player.cards, request.game.pile.cards)
												request.game.table.active = [request.card]
												request.game.updated = new Date().getTime()

											// store data
												main.storeData("games", {id: request.game.id}, game, {}, function (game) {
													if (!game) {
														callback({success: false, message: "unable to save game data"})
													}
													else {
														callback({success: true, game: request.game, distribution: true})
													}
												})
										}
									break

									default
										main.logError("cannot play card: " + request.card + "\n" + error)
										callback({success: false, message: "invalid card type"})
									break
								}
							}
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to play card"})
			}
		}

	/* submitSelection --- not working */
		module.exports.submitSelection = submitSelection
		function submitSelection(request, callback) {
			try {
				if (!request.post) {
					callback({success: false, message: "no target selected"})
				}
				else {
					main.retrieveData("games", {$where: "this.id.substring(0,4) === '" + request.path[2].toLowerCase() + "'"}, {$multi: true}, function (games) {
						if (!games) {
							main.logError("unable to find game: " + request.path[2].toLowerCase())
							callback({success: false, message: "game cannot be found"})
						}
						else if (games[0].state.end) {
							callback({success: false, message: "game already ended"})
						}
						else if (!games[0].players[request.session.id]) {
							callback({success: false, message: "not a player of this game"})
						}
						else {
							request.game = games[0]
							request.player = request.game.players[request.session.id]

							request.target = request.game.players.find(function(p) {
								return p.id == request.post.target
							}) || player.cards.find(function(c) {
								return c.id == request.post.card
							}) || player.cups.find(function(c) {
								return c.id == request.post.card
							}) || null

							// ?????????

							if (!card) {
								callback({success: false, message: "not your card"})
							}
							else if (request.card.form == "cup") {
								drinkCup(request, callback)
							}
							else if (request.card.form == "card") {
								switch (request.card.type.replace(/\s/g,"")) {
									case "arsenicimmunity":
									case "cyanideimmunity":
									case "hemlockimmunity":
									case "nightshadeimmunity":
									case "miracle":
										activateImmunity(request, callback)
									break

									case "switchleft":
									case "switchright":
									case "switchclockwise":
									case "switchcounterclockwise":
										switchCups(request, callback)
									break

									case "switchany":
									case "steal":
									case "drinkup":
										callback({success: true, message: "select a target", selection: true})
									break

									case "look":
										lookAtCups(request, callback)
									break

									case "drinkall":
										drinkAllCups(request, callback)
									break

									case "redistribute":
										redistributeCups(request, callback)
									break

									default
										main.logError("cannot play card: " + request.card + "\n" + error)
										callback({success: false, message: "invalid card type"})
									break
								}
							}
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to select target"})
			}
		}

	/* submitConfirmation --- not started */
		module.exports.submitConfirmation = submitConfirmation
		function submitConfirmation(request, callback) {
		}

/*** changes ***/
	/* moveCard */
		module.exports.moveCard = moveCard
		function moveCard(id, before, after) {
			try {
				// get card
					var card = before.find(function (c) {
						return c.id == id
					}) || {}

				// remove from before
					before = before.filter(function (c) {
						return c.id !== id
					})

				// add to after
					after.push(card)
			}
			catch (error) {
				main.logError(error)
			}
		}

	/* drinkCup */
		module.exports.drinkCup = drinkCup
		function drinkCup(cup, player, request) {
			try {
				// get data
					var type = cup.type.replace(/\s/g, "")
					var immunities = player.immunities.map(function (i) {
						return i.type.replace(/\s/g, "").replace("immunity", "").replace("miracle", "water")
					})

				// poisons
					if (["nightshade", "cyanide", "hemlock", "arsenic"].includes(type)) {
						if (immunities.includes(type)) {
							type = "water"
						}
						else {
							cup.face == "front"
							var targetCount = Math.ceil(player.cards.length / 2)
							while (player.cards.length > targetCount) {
								moveCard(main.chooseRandom(player.cards), player.cards, request.game.pile.cards)
							}
						}
					}

				// neutrals
					if (["water"].includes(type)) {
						if (immunities.includes(type)) {
							type = "wine"
						}
						else {
							cup.face == "front"
						}
					}

				// wines
					if (["wine", "royalwine"].includes(type)) {
						cup.face == "front"
						moveCard(request.game.deck[0], request.game.deck.cards, player.cards)
						moveCard(request.game.deck[0], request.game.deck.cards, player.cards)
					}

					if (type == "royalwine") {
						player.king = true
					}
			}
			catch (error) {
				main.logError(error)
			}
		}

/*** helpers ***/
	/* getOpponents */
		module.exports.getOpponents = getOpponents
		function getOpponents(request, direction) {
			try {
				// start at self
					var seat = request.player.seat
					var playerCount = Object.keys(request.game.players).length
					var opponents = []
				
				// loop through opponents
					do {
						if (direction == "right") {
							seat = (seat ? seat - 1 : playerCount - 1)
						}
						else {
							seat = (seat < playerCount ? seat + 1 : 0)
						}

						var id = Object.keys(request.game.players).find(function (p) {
							return request.game.players[p].seat == seat
						})
						
						opponents.push(request.game.players[id])
					}
					while (seat !== request.player.seat)

				// return
					return opponents
			}
			catch (error) {
				main.logError(error)
			}
		}

	/* getCups */
		module.exports.getCups = getCups
		function getCups(request, direction) {
			try {
				// get opponents
					if (typeof direction == "undefined") { direction == ""}
					var opponents = getOpponents(request, direction)
					var cups = []
				
				// loop through opponents
					for (var i = 0; i < opponents.length; i++) {
						cups.push(opponents[i].cups[0])
					}

				// check for empties
					if (!cups.filter(function (c) { return c.face == "back" }).length) {
						return false
					}
					else {
						return cups
					}
			}
			catch (error) {
				main.logError(error)
			}
		}

	/* getHands */
		module.exports.getHands = getHands
		function getHands(request, direction) {
			try {
				// get opponents
					if (typeof direction == "undefined") { direction == ""}
					var opponents = getOpponents(request, direction)
					var hands = []
				
				// loop through opponents
					for (var i = 0; i < opponents.length; i++) {
						hands.push(opponents[i].cards)
					}

				// check for empties
					if (!hands.filter(function (c) { return c.length })) {
						return false
					}
					else {
						return hands
					}
			}
			catch (error) {
				main.logError(error)
			}
		}

/*** checks ***/
	/* isRoundEnd */
		module.exports.isRoundEnd = isRoundEnd
		function isRoundEnd(request) {
			var cups = getCups(request)
			if (cups) {
				return false
			}
			else {
				return true
			}
		}

	/* isGameEnd */
		module.exports.isGameEnd = isGameEnd
		function isGameEnd(request) {
			var ids = Object.keys(request.game.players)
			var targetCount = 14 - ids.length + (ids.length == 3 ? 1 : 0)

			var victory = false
			for (var i = 0; i < ids.length; i++) {
				if (request.game.players[ids[i]].cards.length >= targetCount) {
					victory = request.game.players[ids[i]]
					i = ids.length
				}
			}

			return victory
		}
