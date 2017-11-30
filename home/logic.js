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
						id: main.generateRandom(),
						created: new Date().getTime(),
						updated: new Date().getTime(),
						state: {
							locked:  false,
							start:   false,
							end:     false,
							victory: false,
							pause:   false,
							round:   null,
							turn:    null
						},
						players:  {},
						cardDeck: [],
						cardPile: [],
						cupDeck:  [],
						cupPile:  []
					}

				// create cards
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("arsenicimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("cyanideimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("hemlockimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("nightshadeimmunity")) }
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("miracle")) }
					for (var i = 0; i < 6; i++) { request.game.cardDeck.push(getCard("switchleft")) }
					for (var i = 0; i < 6; i++) { request.game.cardDeck.push(getCard("switchright")) }
					for (var i = 0; i < 6; i++) { request.game.cardDeck.push(getCard("switchany")) }
					for (var i = 0; i < 4; i++) { request.game.cardDeck.push(getCard("drinkup")) }
					for (var i = 0; i < 4; i++) { request.game.cardDeck.push(getCard("look")) }
					for (var i = 0; i < 6; i++) { request.game.cardDeck.push(getCard("steal")) }
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("switchclockwise")) }
					for (var i = 0; i < 2; i++) { request.game.cardDeck.push(getCard("switchcounterclockwise")) }
					for (var i = 0; i < 1; i++) { request.game.cardDeck.push(getCard("drinkall")) }
					for (var i = 0; i < 1; i++) { request.game.cardDeck.push(getCard("redistribute")) }

					request.game.cardDeck = main.sortRandom(request.game.cardDeck)

				// create cups
					for (var i = 0; i < 1; i++) {  request.game.cupDeck.push( getCup("royalwine")) }
					for (var i = 0; i < 3; i++) {  request.game.cupDeck.push( getCup("wine")) }
					for (var i = 0; i < 4; i++) {  request.game.cupDeck.push( getCup("water")) }
					for (var i = 0; i < 2; i++) {  request.game.cupDeck.push( getCup("arsenic")) }
					for (var i = 0; i < 2; i++) {  request.game.cupDeck.push( getCup("cyanide")) }
					for (var i = 0; i < 2; i++) {  request.game.cupDeck.push( getCup("hemlock")) }
					for (var i = 0; i < 2; i++) {  request.game.cupDeck.push( getCup("nightshade")) }

					request.game.cupDeck  = main.sortRandom(request.game.cupDeck )

				// create player
					request.game.players[request.session.id] = createPlayer(request)
					request.game.players[request.session.id].status.creator = true

				// store data
					main.storeData("games", null, request.game, {}, function (data) {
						callback({success: true, message: "Created the game!", location: "../../game/" + request.game.id.substring(0,4)})
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
				var player = {
					id: request.session.id,
					seat: Object.keys(request.game.players).length || 0,
					name: null,
					cup: null,
					cards: [],
					immunities: [],
					king: false
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
					callback({success: false, message: "You're missing a game id!"})
				}
				else if (gameCode.length !== 4) {
					callback({success: false, message: "The game id must be 4 characters."})
				}
				else if (!main.isNumLet(gameCode)) {
					callback({success: false, message: "The game id must be letters and numbers only."})
				}
				else {
					main.retrieveData("games", {$where: "this.id.substring(0,4) === '" + gameCode + "'"}, {$multi: true}, function (games) {
						if (!games) {
							callback({success: false, message: "The game id was not found..."})
						}
						else if (Object.keys(games[0].players).length >= 6) {
							callback({success: false, message: "This game is maxed out!"})
						}
						else if (games[0].players[request.session.id]) {
							callback({success: true, message: "You've already joined this game.", location: "../../game/" + games[0].id.substring(0,4)})
						}
						else if (games[0].state.start) {
							callback({success: false, message: "This game has already started."})
						}
						else {
							request.game = games[0]
							var player = createPlayer(request)

							var set  = {}
								set.updated = new Date().getTime()
								set["players." + request.session.id] = player

							main.storeData("games", {id: request.game.id}, {$set: set}, {}, function (data) {
								if (!data) {
									callback({success: false, message: "Unable to join this game."})
								}
								else {
									callback({success: true, message: "You joined the game!", location: "../../game/" + request.game.id.substring(0,4)})
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
								type: "arsenicimmunity",
								art: "arsenicimmunity.png",
								color: "gray",
								title: "arsenic immunity",
								details: "arsenic &#8594; water",
								action: "setImmunity(player, 'arsenic');"
							}
						break

						case "cyanideimmunity":
							return {
								type: "cyanideimmunity",
								art: "cyanideimmunity.png",
								color: "orange",
								title: "cyanide immunity",
								details: "cyanide &#8594; water",
								action: "setImmunity(player, 'cyanide');"
							}
						break

						case "hemlockimmunity":
							return {
								type: "hemlockimmunity",
								art: "hemlockimmunity.png",
								color: "green",
								title: "hemlock immunity",
								details: "hemlock &#8594; water",
								action: "setImmunity(player, 'hemlock');"
							}
						break

						case "nightshadeimmunity":
							return {
								type: "nightshadeimmunity",
								art: "nightshadeimmunity.png",
								color: "purple",
								title: "nightshade immunity",
								details: "nightshade &#8594; water",
								action: "setImmunity(player, 'nightshade');"
							}
						break

						case "miracle":
							return {
								type: "miracle",
								art: "miracle.png",
								color: "pink",
								title: "miracle",
								details: "water &#8594; wine",
								action: "setImmunity(player, 'water');"
							}
						break

					// switches
						case "switchleft":
							return {
								type: "switchleft",
								art: "switchleft.png",
								color: "black",
								title: "switch left",
								details: "switch cups with left player",
								action: "switchCups(player, 'left');"
							}
						break

						case "switchright":
							return {
								type: "switchright",
								art: "switchright.png",
								color: "black",
								title: "switch right",
								details: "switch cups with right player",
								action: "switchCups(player, 'right');"
							}
						break

						case "switchany":
							return {
								type: "switchany",
								art: "switchany.png",
								color: "black",
								title: "switch any",
								details: "switch cups with any player",
								action: "switchCups(player, 'any');"
							}
						break

						case "switchclockwise":
							return {
								type: "switchclockwise",
								art: "switchclockwise.png",
								color: "black",
								title: "switch clockwise",
								details: "switch cups with clockwise player",
								action: "switchCups(player, 'clockwise');"
							}
						break

						case "switchcounterclockwise":
							return {
								type: "switchcounterclockwise",
								art: "switchcounterclockwise.png",
								color: "black",
								title: "switch counterclockwise",
								details: "switch cups with counterclockwise player",
								action: "switchCups(player, 'counterclockwise');"
							}
						break

					// special
						case "steal":
							return {
								type: "steal",
								art: "steal.png",
								color: "black",
								title: "steal",
								details: "steal a card from any player",
								action: "stealCard(player, 'any');"
							}
						break

						case "look":
							return {
								type: "look",
								art: "look.png",
								color: "black",
								title: "look",
								details: "look at cards of all player",
								action: "lookCards(player, 'all');"
							}
						break

						case "drinkup":
							return {
								type: "drinkup",
								art: "drinkup.png",
								color: "black",
								title: "drink up!",
								details: "force any player to drink",
								action: "drinkCup('any');"
							}
						break

						case "drinkall":
							return {
								type: "drinkall",
								art: "drinkall.png",
								color: "orange",
								title: "everyone drink!",
								details: "force all players to drink",
								action: "drinkCup('all');"
							}
						break

						case "redistribute":
							return {
								type: "redistribute",
								art: "redistribute.png",
								color: "orange",
								title: "redistribute cups",
								details: "rearrange all active cups",
								action: "distributeCups(player);"
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
								type: "wine",
								art: "wine.png",
								color: "pink",
								title: "wine",
								details: "draw 2 cards",
								action: "drawCard(player); drawCard(player);"
							}
						break
						case "royalwine":
							return {
								type: "royalwine",
								art: "royalwine.png",
								color: "yellow",
								title: "royal wine",
								details: "draw 2 cards",
								action: "drawCard(player); drawCard(player); setKing(player);"
							}
						break
						case "water":
							return {
								type: "water",
								art: "water.png",
								color: "blue",
								title: "water",
								details: "keep cards",
								action: "keepCards(player);",
							}
						break

					// bad
						case "arsenic":
							return {
								type: "arsenic",
								art: "arsenic.png",
								color: "gray",
								title: "arsenic",
								details: "discard half of hand",
								action: "var targetCount = Math.ceil(player.cards.length / 2); while (player.cards.length > targetCount) { discardCard(player); }",
							}
						break
						case "cyanide":
							return {
								type: "cyanide",
								art: "cyanide.png",
								color: "orange",
								title: "cyanide",
								details: "discard half of hand",
								action: "var targetCount = Math.ceil(player.cards.length / 2); while (player.cards.length > targetCount) { discardCard(player); }",
							}
						break
						case "hemlock":
							return {
								type: "hemlock",
								art: "hemlock.png",
								color: "green",
								title: "hemlock",
								details: "discard half of hand",
								action: "var targetCount = Math.ceil(player.cards.length / 2); while (player.cards.length > targetCount) { discardCard(player); }",
							}
						break
						case "nightshade":
							return {
								type: "nightshade",
								art: "nightshade.png",
								color: "purple",
								title: "nightshade",
								details: "discard half of hand",
								action: "var targetCount = Math.ceil(player.cards.length / 2); while (player.cards.length > targetCount) { discardCard(player); }",
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