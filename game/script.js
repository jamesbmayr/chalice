/*** onload ***/
	/* globals */
		var board   = document.getElementById("board")
		var status  = document.getElementById("status")
		var round   = parseInt(board.getAttribute("round")) || null
		var turn    = parseInt(board.getAttribute("turn"))  || null
		var player  =          board.getAttribute("player") || null
		var active  = null
		var activeX = null
		var activeY = null

/*** builds ***/
	/* buildPerson */
		function buildPerson(person) {
			// cards
				var cardsBlock = '<div class="cards" id="' + person.id + '-cards">'
				for (var c = 0; c < person.cards.length; c++) {
					cardsBlock += '<div class="card" face="' + (person.id == player ? "front" : "back") + '" type="" id="' + person.cards[c].id + '">'
						+ '<div class="card-back"></div>'
						+ '<div class="card-front"></div>'
					+ '</div>'
				}
				cardsBlock += '</div>'

			// immunities
				var immunitiesBlock = '<div class="immunities" id="' + person.id + '-immunities">'
				for (var i = 0; i < person.immunities.length; i++) {
					immunitiesBlock += '<div class="card" face="front" type="' + person.immunities[i].type.replace(/\s/g,"") + '" id="' + person.immunities[i].id + '">'
						+ '<div class="card-back"></div>'
						+ '<div class="card-front"></div>'
					+ '</div>'
				}
				immunitiesBlock += '</div>'

			// cups
				var cupsBlock = '<div class="cups" id="' + person.id + '-cups">'
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
		function buildTable(game) {
			// deck
				var deckBlock = '<div id="deck">'
					+ '<div id="deck-cards" class="cards">' + game.spots.deck.cards.length + '</div>'
					+ '<div id="deck-cups"  class="cups" >' + game.spots.deck.cups.length + '</div>'
				+ '</div>'

			// pile
				var pileBlock = '<div id="pile">'
					+ '<div id="pile-cards" class="cards">' + game.spots.pile.cards.length + '</div>'
					+ '<div id="pile-cups"  class="cups" >' + game.spots.pile.cups.length + '</div>'
				+ '</div>'

			// table
				var tableBlock = ''
				var begin = game.state.begin ? "" : " disabled"

				if (!game.state.start) {
					tableBlock += '<div id="status">game has not started</div>'
					+ '<div id="prompt"></div>'
					+ '<div id="begin"' + begin + '>begin round</div>'
					+ '<div id="table-cups"  class="cups" ></div>'
					+ '<div id="table-cards" class="cards"></div>'
				}
				else if (game.state.end) {
					tableBlock += '<div id="status">victory for ' + game.state.victor.name.join(" and ") + '!</div>'
					+ '<div id="prompt"></div>'
					+ '<div id="begin"' + begin + '>begin round</div>'
					+ '<div id="table-cups"  class="cups" ></div>'
					+ '<div id="table-cards" class="cards"></div>'
				}
				else {
					if (turn !== player) {
						tableBlock += '<div id="status">opponent\'s turn</div>'
						+ '<div id="prompt"></div>'
						+ '<div id="begin"' + begin + '>begin round</div>'
					}
					else {
						tableBlock += '<div id="status">your turn</div>'
						+ '<div id="prompt">' + game.spots.table.prompt + '</div>'
						+ '<div id="begin"' + begin + '>begin round</div>'
					}

					// cups
						var cupsBlock = '<div id="table-cups" class="cups">'
						for (var c in game.spots.table.cups) {
							var cup = game.spots.table.cups[c]
							cupsBlock += '<div class="cup" face="front" type="' + cup[c].type.replace(/\s/g,"") + '" id="' + cup[c].id + '">'
								+ '<div class="cup-back"></div>'
								+ '<div class="cup-front"></div>'
							+ '</div>'
						}
						cupsBlock += "</div>"
					tableBlock += cupsBlock

					// cards
						var cardsBlock += '<div id="table-cards" class="cards">'
						for (var c in game.spots.table.cards) {
							var card = game.spots.table.cards[c]
							cardsBlock += '<div class="card" face="front" type="' + card[c].type.replace(/\s/g,"") + '" id="' + card[c].id + '">'
								+ '<div class="card-back"></div>'
								+ '<div class="card-front"></div>'
							+ '</div>'
						}
						cardsBlock += "</div>"
					tableBlock += cardsBlock
				}

			// combination
				return deckBlock + pileBlock + tableBlock
		}

	/* buildEverything */
		function buildEverything(game) {
			// update players
				document.getElementById(player).outerHTML = buildPerson(game.spots[player]) || ""

				var opponents = Object.keys(game.spots).filter(function (s) {
					return ![player, "table", "deck", "pile"].includes(s)
				}) || []
				for (var o in opponents) {
					document.getElementById(opponents[o]).outerHTML = buildPerson(game.spots[opponents[o]]) || ""
				}

			// update table
				document.getElementById("deck").remove()
				document.getElementById("pile").remove()
				document.getElementById("table").outerHTML = buildTable(game) || ""

			// update event listeners
				var cards = Array.from(document.querySelectorAll(".card")).concat(Array.from(document.querySelectorAll(".cup")))
				for (var c in cards) { cards[c].addEventListener("mousedown", selectCard) }

			// check for game end
				if (game.state.end) {
					clearInterval(fetchLoop)
					status.innerText = "the game is over!"
				}
		}

/*** moves ***/
	/* selectCard */
		var cards = Array.from(document.querySelectorAll(".card")).concat(Array.from(document.querySelectorAll(".cup")))
		for (var c in cards) { cards[c].addEventListener("mousedown", selectCard) }
		function selectCard(event) {
			if (event.target.className == "card" || event.target.className == "cup") {
				// get coordinates
					var x = ((event.clientX !== undefined) ? event.clientX : event.targetTouches[0].clientX)
					var y = ((event.clientY !== undefined) ? event.clientY : event.targetTouches[0].clientY)

				// activate card
					active  = event.target
					activeX = x - event.target.getBoundingClientRect().left
					activeY = y - event.target.getBoundingClientRect().top
					active.setAttribute("active", true)
			}
		}

	/* unselectCard */
		document.addEventListener("mouseup", unselectCard)
		function unselectCard(event) {
			// get coordinates
				var x = ((event.clientX !== undefined) ? event.clientX : event.targetTouches[0].clientX)
				var y = ((event.clientY !== undefined) ? event.clientY : event.targetTouches[0].clientY)

			// identify target
				var targets = Array.from(document.querySelectorAll(".cards")).concat(Array.from(document.querySelectorAll(".cups"))).concat(Array.from(document.querySelectorAll(".immunities")))
				var target = null

				for (var t = 0; t < targets.length; t++) {
					var box = targets[t].getBoundingClientRect()
					if (y >= box.top && y <= box.bottom && x <= box.right && x >= box.left) {
						target = targets[t]
						t = targets.length
					}
				}

			// submit data
				submitMove(target)
		}

	/* moveCard */
		document.addEventListener("mousemove", moveCard)
		function moveCard(event) {
			if (active) {
				// get coordinates
					var x = ((event.clientX !== undefined) ? event.clientX : event.targetTouches[0].clientX)
					var y = ((event.clientY !== undefined) ? event.clientY : event.targetTouches[0].clientY)

				// move card
					active.style.position.left = x - activeX
					active.style.position.top  = y - activeY
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

	/* submitMove */
		function submitMove(target) {
			if (!active) {
				displayError("no card selected...")
			}
			else if (!target) {
				displayError("no target selected...")
			}
			else {
				sendPost({action: "submitMove", card: active.id, target: target.id}, function (response) {
					if (!response.success) {
						displayError(response.message || "unable to move card...")
					}
					else {
						if (response.message) {
							displayError(response.message)
						}

						// deactivate card
							active.removeAttribute("active")
							active  = null
							activeX = null
							activeY = null

						// update board
							buildEverything(response.game)
					}
				})
			}
		}

	/* submitBegin */
		function submitBegin(event) {
			if (event.target.className == "begin") {
				sendPost({action: "beginRound"}, function(response) {
					if (!response.success) {
						displayError(response.message || "unable to begin round...")
					}
					else {
						if (response.message) {
							displayError(response.message)
						}

						// update board
							buildEverything(response.game)
					}
				})
			}
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
