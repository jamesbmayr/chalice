/*** actions ***/
	/* createGame */
		document.getElementById("createGame").addEventListener("click", createGame)
		function createGame() {
			var post = {
				action: "createGame"
			}

			sendPost(post, function(data) {
				if (!data.success) {
					displayError(data.message || "unable to create a game...")
				}
				else {
					window.location = data.location
				}
			})
		}

	/* joinGame */
		document.getElementById("joinGame").addEventListener("click", joinGame)
		document.getElementById("gameCode").addEventListener("keyup", function (event) { if (event.which == 13) { joinGame() } })
		function joinGame() {
			var gameCode = document.getElementById("gameCode").value.replace(" ","").trim().toLowerCase() || false

			if (gameCode.length !== 4) {
				displayError("game code must be 4 characters...")
			}
			else if (!isNumLet(gameCode)) {
				displayError("game code can be letters and numbers only...")
			}
			else {
				var post = {
					action: "joinGame",
					gameCode: gameCode
				}

				sendPost(post, function(data) {
					if (!data.success) {
						displayError(data.message || "unable to join this game...")
					}
					else {
						window.location = data.location
					}
				})
			}
		}

/*** purchase ***/
	/* showPurchase */
		document.getElementById("show").addEventListener("click", showPurchase)
		function showPurchase() {
			document.getElementById("purchase").className = "visible"
		}

	/* hidePurchase */
		document.getElementById("hide").addEventListener("click", hidePurchase)
		function hidePurchase() {
			document.getElementById("purchase").className = "invisible"
		}