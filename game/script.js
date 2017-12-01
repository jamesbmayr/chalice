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
					immunitiesBlock += '<div class="card" face="front" type="' + person.immunities[i].type + '" id="' + person.immunities[i].id + '">'
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
				var nameBlock = '<div class="name">'
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
		function buildTable() {
			var tableBlock = ''

			if (!request.game.state.start) {
				tableBlock += '<div id="status">game has not started</div>'
				+ '<div class="cups"></div>'
				+ '<div class="cards"></div>'
			}
			else if (request.game.state.end) {
				tableBlock += '<div id="status">' + request.game.players[request.game.state.victor].name + ' wins!</div>'
				+ '<div class="cups"></div>'
				+ '<div class="cards"></div>'
			}
			else if (turn !== player) {
				tableBlock += '<div id="status">opponent\'s turn</div>'
				+ '<div class="cups"></div>'
				+ '<div class="cards"></div>'
			}
			else {
				// cups
					var cupsBlock = '<div class="cups">'
					for (var c in request.game.cupTable) {
						var cup = request.game.cupTable[c]
						cupsBlock += '<div class="cup" face="front" type="' + cup[c].type + '" id="' + cup[c].id + '">'
							+ '<div class="cup-back"></div>'
							+ '<div class="cup-front"></div>'
						+ '</div>'
					}
					cupsBlock += "</div>"

				// cards
					var cardsBlock += '<div class="cards">'
					for (var c in request.game.cardTable) {
						var card = request.game.cardTable[c]
						cardsBlock += '<div class="card" face="front" type="' + card[c].type + '" id="' + card[c].id + '">'
							+ '<div class="card-back"></div>'
							+ '<div class="card-front"></div>'
						+ '</div>'
					}
					cardsBlock += "</div>"

				// table
					tableBlock = '<div id="status">your turn</div>'
					+ cupsBlock
					+ cardsBlock
			}

			return tableBlock || ''
		}

/*** submits ***/
	/* submitCard */
		function submitCard(event) {
			//
		}

	/* submitChoice */
		function submitChoice(event) {
			//
		}

/*** fetch ***/
	/* fetchLoop */
		fetchLoop = setInterval(fetchData, 5000)
		if (typeof window.clearLoop !== "undefined" && window.clearLoop !== null && window.clearLoop) { clearInterval(fetchLoop) }
		function fetchData() {
			sendPost({action: "fetchData", round: round, turn: turn}, function(response) {
				if (!response.success) {
					displayError(response.message || "Unable to fetch data...")
				}
				else if (response.game.state.round !== round || response.game.state.turn !== turn) {
					// update data
						round = response.game.state.round || null
						turn  = response.game.state.turn  || null

					// update players
						document.getElementById(player).outerHTML = buildPerson(response.game.players[player])

						var opponents = Object.keys(response.game.players).filter(function (p) {
							return p !== player
						}) || []
						for (var o in opponents) {
							document.getElementById(opponents[o]).outerHTML = buildPerson(response.game.players[opponents[o]])
						}

					// update table
						document.getElementById("table").outerHTML = buildTable()

					// check for game end
						if (response.game.state.end) {
							clearInterval(fetchLoop)
							status.innerText = response.game.state.victor + " wins!"
						}
				}
			})
		}