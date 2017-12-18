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
					cardsBlock += '<div class="card" face="' + (person.id == player ? "front" : "back") + '" type="' + (person.id == player ? person.cards[c].type.replace(/\s/g, "") : "") + '" id="' + person.cards[c].id + '"></div>'
				}
				cardsBlock += '</div>'

			// immunities
				var immunitiesBlock = '<div class="immunities" id="' + person.id + '-immunities">'
				for (var i = 0; i < person.immunities.length; i++) {
					immunitiesBlock += '<div class="card" face="front" type="' + person.immunities[i].type.replace(/\s/g, "") + '" id="' + person.immunities[i].id + '"></div>'
				}
				immunitiesBlock += '</div>'

			// cups
				var cupsBlock = '<div class="cups" id="' + person.id + '-cups">'
				for (var c = 0; c < person.cups.length; c++) {
					cupsBlock += '<div class="cup" face="' + person.cups[c].face + '" type="' + (person.cups[c].face == "front" ? person.cups[c].type : "") + '" id="' + person.cups[c].id + '"></div>'
				}
				cupsBlock += '</div>'

			// name
				var nameBlock = '<textarea autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" class="name" ' + (person.id == player ? "" : "disabled") + '>'
					+ (person.name || "player " + (person.seat))
				+ '</textarea>'

			// combined
				var personBlock = '<div class="' + (person.id == player ? "player" : "opponent") + '" turn="' + (turn == person.seat ? "true" : "false") + '" id="' + person.id + '">'
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
					+ '<button id="deck-cards" class="cards">' + game.spots.deck.cards.length + '</button>'
					+ '<button id="deck-cups"  class="cups" >' + game.spots.deck.cups.length + '</button>'
				+ '</div>'

			// pile
				var pileBlock = '<div id="pile">'
					+ '<button id="pile-cards" class="cards">' + game.spots.pile.cards.length + '</button>'
					+ '<button id="pile-cups"  class="cups" >' + game.spots.pile.cups.length + '</button>'
				+ '</div>'

			// status
				if (!game.state.start) {
					var tableBlock = '<div id="status">game has not started</div>'
					+ '<button id="begin"' + begin + '>begin round</button>'
					+ '<div id="table-cups"  class="cups" ></div>'
					+ '<div id="table-cards" class="cards"></div>'
				}
				else if (game.state.end) {
					var tableBlock = '<div id="status">victory for ' + game.state.victor.name.join(" and ") + '!</div>'
					+ '<button id="begin"' + begin + '>begin round</button>'
					+ '<div id="table-cups"  class="cups" ></div>'
					+ '<div id="table-cards" class="cards"></div>'
				}
				else if (turn !== player) {
					var tableBlock = '<div id="status">' + (game.state.status || ((game.spots[game.state.turn].name || ("player " + game.spots[game.state.turn].seat)) + "'s turn")) + '</div>'
				}
				else {
					var tableBlock = '<div id="status">' + (game.state.status || "your turn") + '</div>'
				}

			// status
				tableBlock += '<button id="begin"' + (game.state.begin ? "" : " disabled") + '>begin round</button>'

			// cups
				var cupsBlock = '<div id="table-cups" class="cups">'
				for (var c in game.spots.table.cups) {
					var cup = game.spots.table.cups[c]
					cupsBlock += '<div class="cup" face="' + (turn == player ? "front" : "back") + '" type="' + (turn == player ? cup.type.replace(/\s/g, "") : "") + '" id="' + cup.id + '"></div>'
				}
				cupsBlock += "</div>"
				tableBlock += cupsBlock

			// cards
				var cardsBlock = '<div id="table-cards" class="cards">'
				for (var c in game.spots.table.cards) {
					var card = game.spots.table.cards[c]
					cardsBlock += '<div class="card" face="front" type="' + card.type.replace(/\s/g, "") + '" id="' + card.id + '"></div>'
				}
				cardsBlock += "</div>"
				tableBlock += cardsBlock

			// combination
				return deckBlock + pileBlock + '<div id="table">' + tableBlock + '</div>'
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

			// update stats
				round = game.state.round
				board.setAttribute("round", round)

				turn  = game.state.turn
				board.setAttribute("turn",  turn)

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
					active.style.left = x - activeX + "px"
					active.style.top  = y - activeY + "px"
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
					active.style.left = x - activeX + "px"
					active.style.top  = y - activeY + "px"
			}
		}

/*** submits ***/
	/* submitName */
		try {
			if (player) { Array.from(document.getElementById(player).querySelectorAll(".name"))[0].addEventListener("change", submitName) }
		} catch (error) {}
		function submitName(event) {
			if (player) {
				var name = Array.from(document.getElementById(player).querySelectorAll(".name"))[0]
				var newName = sanitizeString(name.value)

				sendPost({action: "submitName", name: newName}, function (response) {
					if (!response.success) {
						displayError(response.message || "unable to change name...")
					}
					else {
						if (response.message) {
							displayError(response.message)
						}

						name.value = response.name
					}
				})
			}
		}

	/* submitMove */
		function submitMove(target) {
			if (!active) {
				//
			}
			else if (!target) {
				displayError("no target selected...")
			}
			else {
				sendPost({action: "submitMove", card: active.id, target: target.id}, function (response) {
					if (!response.success) {
						displayError(response.message || "unable to move card...")

						// deactivate card
							active.removeAttribute("active")
							active  = null
							activeX = null
							activeY = null
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
		document.getElementById("begin").addEventListener("click", submitBegin)
		function submitBegin(event) {
			if (event.target.id == "begin") {
				sendPost({action: "submitBegin"}, function(response) {
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
