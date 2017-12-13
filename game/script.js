/*** onload ***/
	/* globals */
		var board  = document.getElementById("board")
		var status = document.getElementById("status")
		var round  = parseInt(board.getAttribute("round")) || null
		var turn   = parseInt(board.getAttribute("turn"))  || null
		var player =          board.getAttribute("player") || null

/*** builds ***/
	/* buildPerson */
		function buildPerson(person) {
			// cards
				var cardsBlock = '<div class="cards">'
				for (var c = 0; c < person.cards.length; c++) {
					cardsBlock += '<div class="card" face="' + (person.id == player ? "front" : "back") + '" type="" id="' + person.cards[c].id + '">'
						+ '<div class="card-back"></div>'
						+ '<div class="card-front"></div>'
					+ '</div>'
				}
				cardsBlock += '</div>'

			// immunities
				var immunitiesBlock = '<div class="immunities>'
				for (var i = 0; i < person.immunities.length; i++) {
					immunitiesBlock += '<div class="card" face="front" type="' + person.immunities[i].type.replace(/\s/g,"") + '" id="' + person.immunities[i].id + '">'
						+ '<div class="card-back"></div>'
						+ '<div class="card-front"></div>'
					+ '</div>'
				}
				immunitiesBlock += '</div>'

			// cups
				var cupsBlock = '<div class="cups>'
				for (var c = 0; c < person.cups.length; c++) {
					cupsBlock += '<div class="cup" face="' + person.cups[c].face + '" type="" id="' + person.cups[c].id + '">'
						+ '<div class="cup-back"></div>'
						+ '<div class="cup-front"></div>'
					+ '</div>'
				}
				cupsBlock += '</div>'

			// name
				var nameBlock = '<div class="name" ' + (person.id == player ? "contenteditable" : "") + '>'
					+ person.name
				+ '</div>'

			// combined
				var personBlock = '<div class="' + (person.id == player ? "player" : "opponent") + '" turn="' + (request.game.state.turn == person.seat ? "true" : "false") + '" id="' + person.id + '">'
					+ nameBlock
					+ cupsBlock
					+ immunitiesBlock
					+ cardsBlock
				+ '</div>'

			return personBlock || ''
		}

	/* buildTable */
		function buildTable(state, table) {
			var tableBlock = ''

			if (!state.start) {
				tableBlock += '<div id="status">game has not started</div>'
				+ '<div id="active"></div>'
				+ '<div id="prompt"></div>'
				+ '<div class="cups"></div>'
				+ '<div class="cards"></div>'
			}
			else if (state.end) {
				tableBlock += '<div id="status">' + state.victor.name + ' wins!</div>'
				+ '<div id="active"></div>'
				+ '<div id="prompt"></div>'
				+ '<div class="cups"></div>'
				+ '<div class="cards"></div>'
			}
			else if (turn !== player) {
				// active
					var activeBlock = '<div id="active">'
					for (var a in table.active) {
						var card = table.active[a]
						activeBlock += '<div class="card" face="front" type="' + card[a].type.replace(/\s/g,"") + '" id="' + card[a].id + '">'
							+ '<div class="card-back"></div>'
							+ '<div class="card-front"></div>'
						+ '</div>'
					}
					activeBlock += "</div>"

				// table		
					tableBlock += '<div id="status">opponent\'s turn</div>'
					+ activeBlock
					+ '<div id="prompt"></div>'
					+ '<div class="cups"></div>'
					+ '<div class="cards"></div>'
			}
			else {
				// active
					var activeBlock = '<div id="active">'
					for (var a in table.active) {
						var card = table.active[a]
						activeBlock += '<div class="card" face="front" type="' + card[a].type.replace(/\s/g,"") + '" id="' + card[a].id + '">'
							+ '<div class="card-back"></div>'
							+ '<div class="card-front"></div>'
						+ '</div>'
					}
					activeBlock += "</div>"

				// cups
					var cupsBlock = '<div class="cups">'
					for (var c in request.game.table.cups) {
						var cup = request.game.table.cups[c]
						cupsBlock += '<div class="cup" face="front" type="' + cup[c].type.replace(/\s/g,"") + '" id="' + cup[c].id + '">'
							+ '<div class="cup-back"></div>'
							+ '<div class="cup-front"></div>'
						+ '</div>'
					}
					cupsBlock += "</div>"

				// cards
					var cardsBlock += '<div class="cards">'
					for (var c in request.game.table.cards) {
						var card = request.game.table.cards[c]
						cardsBlock += '<div class="card" face="front" type="' + card[c].type.replace(/\s/g,"") + '" id="' + card[c].id + '">'
							+ '<div class="card-back"></div>'
							+ '<div class="card-front"></div>'
						+ '</div>'
					}
					cardsBlock += "</div>"

				// table
					tableBlock = '<div id="status">your turn</div>'
					+ activeBlock
					+ '<div id="prompt">' + table.prompt + '</div>'
					+ cupsBlock
					+ cardsBlock
			}

			return tableBlock || ''
		}

	/* buildEverything */
		function buildEverything(game) {
			// update players
				document.getElementById(player).outerHTML = buildPerson(game.players[player]) || ""

				var opponents = Object.keys(game.players).filter(function (p) {
					return p !== player
				}) || []
				for (var o in opponents) {
					document.getElementById(opponents[o]).outerHTML = buildPerson(game.players[opponents[o]]) || ""
				}

			// update table
				document.getElementById("table").outerHTML = buildTable(game.state, game.table) || ""

			// check for game end
				if (game.state.end) {
					clearInterval(fetchLoop)
					status.innerText = game.state.victor + " wins!"
				}
		}

/*** submits ***/
	/* submitName */
		if (player) { Array.from(document.getElementById(player).querySelectorAll("name"))[0].addEventListener("change", submitName) }
		function submitName(event) {
			if (player) {
				var name = Array.from(document.getElementById(player).querySelectorAll("name"))[0]
				var newName = sanitizeString(name.innerText)

				sendPost({action: "submitName"}, function (response) {
					if (!response.success) {
						displayError(response.message || "unable to change name...")
					}
					else {
						if (response.message) {
							displayError(response.message)
						}

						name.innerText = response.name
					}
				})
			}
		}

	/* submitCard */
		function submitCard(event) {
			if (event.target.className == "card" || event.target.className == "cup") {
				var card = event.target.id

				sendPost({action: "submitCard", round: round, turn: turn, card: card}, function(response) {
					if (!response.success) {
						displayError(response.message || "unable to play card...")
					}
					else {
						if (response.message) {
							displayError(response.message)
						}

						document.getElementById(player).outerHTML  = buildPerson(response.game.players[player]) || ""
						document.getElementById("table").outerHTML = buildTable(response.game.state, response.game.table) || ""
					}
				})
			}
		}

	/* submitSelection */
		function submitSelection(event) {
			if (event.target.className == "card" || event.target.className == "cup" || event.target.className == "player" || event.target.className == "opponent") {
				var target = event.target.id

				sendPost({action: "submitSelection", round: round, turn: turn, target: target}, function(response) {
					if (!response.success) {
						displayError(response.message || "unable to select target...")
					}
					else {
						if (response.message) {
							displayError(response.message)
						}

						document.getElementById(player).outerHTML  = buildPerson(response.game.players[player]) || ""
						document.getElementById("table").outerHTML = buildTable(response.game.state, response.game.table) || ""
					}
				})
			}
		}

	/* submitConfirmation */
		function submitConfirmation(event) {
			//
		}

/*** fetch ***/
	/* fetchLoop */
		fetchLoop = setInterval(fetchData, 5000)
		if (typeof window.clearLoop !== "undefined" && window.clearLoop !== null && window.clearLoop) { clearInterval(fetchLoop) }
		function fetchData() {
			sendPost({action: "fetchData", round: round, turn: turn}, function(response) {
				if (!response.success) {
					displayError(response.message || "unable to fetch data...")
				}
				else if (response.game.state.round !== round || response.game.state.turn !== turn) {
					buildEverything(response.game)
				}
			})
		}
