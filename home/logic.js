/*** modules ***/
	var main = require("../main/logic")
	var game = require("../game/logic")
	module.exports = {}

/*** creates ***/
	/* createGame */
		module.exports.createGame = createGame
		function createGame(request, callback) {
			try {
				// create game
					request.game = {
						id: main.generateRandom("abcdefghijklmnopqrstuvwxyz", 4),
						created: new Date().getTime(),
						updated: new Date().getTime(),
						state: {
							start:    null,
							end:      null,
							victor: {
								id:   null,
								name: null,
							},
							round:    0,
							turn:     null,
							begin:    false,
							acted:    false,
							status:   ""
						},
						spots: {
							table: {
								id:     "table",
								cards:  [],
								cups:   []
							},
							deck: {
								id:     "deck",
								cards:  [],
								cups:   []
							},
							pile: {
								id:     "pile",
								cards:  [],
								cups:   []
							}
						}
					}

				// create cards
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("arsenicimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("cyanideimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("hemlockimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("nightshadeimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("miracle")) }
					for (var i = 0; i < 6; i++) { request.game.spots.deck.cards.push(getCard("switchleft")) }
					for (var i = 0; i < 6; i++) { request.game.spots.deck.cards.push(getCard("switchright")) }
					for (var i = 0; i < 6; i++) { request.game.spots.deck.cards.push(getCard("switchany")) }
					for (var i = 0; i < 4; i++) { request.game.spots.deck.cards.push(getCard("drinkup")) }
					for (var i = 0; i < 4; i++) { request.game.spots.deck.cards.push(getCard("look")) }
					for (var i = 0; i < 6; i++) { request.game.spots.deck.cards.push(getCard("steal")) }
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("switchclockwise")) }
					for (var i = 0; i < 2; i++) { request.game.spots.deck.cards.push(getCard("switchcounterclockwise")) }
					for (var i = 0; i < 1; i++) { request.game.spots.deck.cards.push(getCard("drinkall")) }
					for (var i = 0; i < 1; i++) { request.game.spots.deck.cards.push(getCard("redistribute")) }

					request.game.spots.deck.cards = main.sortRandom(request.game.spots.deck.cards)

				// create cups
					for (var i = 0; i < 1; i++) {  request.game.spots.table.cards.push(getCup("royalwine")) }
					for (var i = 0; i < 3; i++) {  request.game.spots.deck.cups.push(getCup("wine")) }
					for (var i = 0; i < 4; i++) {  request.game.spots.deck.cups.push(getCup("water")) }
					for (var i = 0; i < 2; i++) {  request.game.spots.deck.cups.push(getCup("arsenic")) }
					for (var i = 0; i < 2; i++) {  request.game.spots.deck.cups.push(getCup("cyanide")) }
					for (var i = 0; i < 2; i++) {  request.game.spots.deck.cups.push(getCup("hemlock")) }
					for (var i = 0; i < 2; i++) {  request.game.spots.deck.cups.push(getCup("nightshade")) }

					request.game.spots.deck.cups  = main.sortRandom(request.game.spots.deck.cups )

				// create player
					request.game.spots[request.session.id] = createPlayer(request)
					request.game.spots[request.session.id].creator = true

				// store data
					main.storeData("games", null, request.game, {}, function (data) {
						callback({success: true, message: "created the game", location: "../../game/" + request.game.id})
					})
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to create game"})
			}
		}

	/* createPlayer */
		module.exports.createPlayer = createPlayer
		function createPlayer(request) {
			try {
				var all = Object.keys(request.game.spots).filter(function (s) { return !["table", "deck", "pile"].includes(s) })

				var player = {
					id: request.session.id,
					seat: all.length || 0,
					name: null,
					cups: [],
					cards: [],
					immunities: [],
					king: false,
					active: true,
					debt: 0
				}

				return player
			}
			catch (error) {
				main.logError(error)
				return null
			}
		}

/*** submits ***/
	/* joinGame */
		module.exports.joinGame = joinGame
		function joinGame(request, callback) {
			try {
				var gameCode = request.post.gameCode.replace(" ", "").trim().toLowerCase() || false

				if (!gameCode) {
					callback({success: false, message: "missing a game id"})
				}
				else if (gameCode.length !== 4) {
					callback({success: false, message: "game id must be 4 characters"})
				}
				else if (!main.isNumLet(gameCode)) {
					callback({success: false, message: "game id must be letters and numbers only"})
				}
				else {
					main.retrieveData("games", {id: gameCode}, {$multi: true}, function (games) {
						if (!games) {
							callback({success: false, message: "game id not found"})
						}
						else if (Object.keys(games[0].spots).length >= 9) {
							callback({success: false, message: "game is maxed out"})
						}
						else if (games[0].spots[request.session.id]) {
							callback({success: true, message: "already joined this game", location: "../../game/" + games[0].id})
						}
						else if (games[0].state.start) {
							callback({success: false, message: "game has already started"})
						}
						else {
							request.game = games[0]

							// create player
								var player = createPlayer(request)
								request.game.spots[request.session.id] = player
								if (player.seat > 1) {
									request.game.state.begin = true
								}

							// move a cup
								game.completeMove(request.game.spots.deck.cups[0], request.game.spots.deck.cups, request.game.spots.table.cards)

							request.game.state.updated = new Date().getTime()
							main.storeData("games", {id: request.game.id}, {$set: request.game}, {}, function (data) {
								if (!data) {
									callback({success: false, message: "unable to join this game"})
								}
								else {
									callback({success: true, message: "joined the game", location: "../../game/" + request.game.id})
								}
							})
						}
					})
				}
			}
			catch (error) {
				main.logError(error)
				callback({success: false, message: "unable to join game"})
			}
		}

/*** maps ***/
	/* getCard */
		function getCard(index) {
			try {
				switch (index) {
					// immunities
						case "arsenicimmunity":
							return {
								id: main.generateRandom(),
								form: "card",
								type: "arsenic immunity",
								text: "arsenic &#8594; water",
							}
						break

						case "cyanideimmunity":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "cyanide immunity",
								text: "cyanide &#8594; water",
							}
						break

						case "hemlockimmunity":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "hemlock immunity",
								text: "hemlock &#8594; water",
							}
						break

						case "nightshadeimmunity":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "nightshade immunity",
								text: "nightshade &#8594; water",
							}
						break

						case "miracle":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "miracle",
								text: "water &#8594; wine",
							}
						break

					// switches
						case "switchleft":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "switch left",
								text: "switch cups with left player",
							}
						break

						case "switchright":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "switch right",
								text: "switch cups with right player",
							}
						break

						case "switchany":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "switch any",
								text: "switch cups with any player",
							}
						break

						case "switchclockwise":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "switch clockwise",
								text: "switch cups with clockwise player",
							}
						break

						case "switchcounterclockwise":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "switch counterclockwise",
								text: "switch cups with counterclockwise player",
							}
						break

					// special
						case "steal":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "steal",
								text: "steal a card from any player",
							}
						break

						case "look":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "look",
								text: "look at cards of all player",
							}
						break

						case "drinkup":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "drink up",
								text: "force any player to drink",
							}
						break

						case "drinkall":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "drink all",
								text: "force all players to drink",
							}
						break

						case "redistribute":
							return {
								id:   main.generateRandom(),
								form: "card",
								type: "redistribute",
								text: "rearrange all active cups",
							}
						break

					// other
						default:
							main.logError("unable to find card: " + index)
							return null
				}
			}
			catch (error) {
				main.logError(error)
				return null
			}
		}

	/* getCup */
		function getCup(index) {
			try {
				switch (index) {
					// good
						case "wine":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "wine",
								text: "draw 2 cards",
								face: "back"
							}
						break
						case "royalwine":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "royal wine",
								text: "draw 2 cards",
								face: "back"
							}
						break
						case "water":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "water",
								text: "keep cards",
								face: "back"
							}
						break

					// bad
						case "arsenic":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "arsenic",
								text: "discard half of hand",
								face: "back"
							}
						break
						case "cyanide":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "cyanide",
								text: "discard half of hand",
								face: "back"
							}
						break
						case "hemlock":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "hemlock",
								text: "discard half of hand",
								face: "back"
							}
						break
						case "nightshade":
							return {
								id:   main.generateRandom(),
								form: "cup",
								type: "nightshade",
								text: "discard half of hand",
								face: "back"
							}
						break

					// other
						default:
							main.logError("unable to find cup: " + index)
							return null
				}
			}
			catch (error) {
				main.logError(error)
				return null
			}
		}
		