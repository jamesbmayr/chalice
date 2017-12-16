# Chalice

a game of death and deception: http://www.chalicethegame.com

<pre style='line-height: 0.5; text-align: center'>
   ______________   
  |              |  
  |              |  
  |              |  
   \            /   
    \          /    
     \__    __/     
        |  |        
        |  |        
        |  |        
       /    \       
      /______\      
</pre>
<hr>

# Rules


## Requirements

• 3-6 players

• 1 smartphone/computer each

• 30-60 minutes



## Setup

• One player creates a game using the "new" button.

• All other players join using the 4-letter gamecode and the "join" button.

• Each player inputs a name.

• Each player receives a cup, face-down.

• Each player receives 4 cards.



## Gameplay

• On your turn, you must either play a card from your hand or drink your cup.

• After you drink your cup, you're done for the round.

• When all players have had a drink, deal each player 1 card and 1 new face-down cup.




## Cards

• *switch cups*: trade cups in the direction indicated; players may look at the cup first, and may choose to forego the switch

• *look at cups*: see what's inside all the cups on the table

• *steal a card*: take a card from an opponent hand, or an immunity from in front of any opponent

• *drink up!*: force an opponent to drink their cup and suffer the consequences

• *immunity*: become immune to a particular poison; resolve ethat poison as water

• *miracle*: turn water into wine; resolve water cups as wine



## Cups

• *cyanide*, *arsenic*, *nightshade*, *hemlock*: discard half your cards (rounding down)

• *water*: keep your cards

• *wine*: draw 2 cards

• *royal wine*: draw 2 cards; choose the cup placement for the next round



## Ending

You win when you have a certain number of cards in your hand at the end of a round:

• *3 players*: 12 cards

• *4 players*: 10 cards

• *5 players*: 9 cards

• *6 players*: 8 cards




<hr>

# App Structure

<pre>
|- package.json
|- index.js (handleRequest, parseRequest, routeRequest; _302, _403, _404)
|
|- /node-modules/
|   |- mongo
|
|- /data/db/
|   |- sessions
|   |- games
|
|- /main/
|   |- logic.js (logError, logStatus, logMessage; getEnvironment, getAsset; isReserved, isNumLet, isBot; renderHTML; generateRandom, chooseRandom, sortRandom; locateIP, sanitizeString, determineSession; retrieveData, storeData)
|   |- stylesheet.css
|   |- script.js (isNumLet, isEmail; sanitizeString, displayError; sendPost)
|   |
|   |- banner.png
|   |- logo.png
|   |- _404.html
|
|- / (home)
|   |- logic.js (createGame, createPlayer; joinGame; getCard, getCup)
|   |- index.html
|   |- stylesheet.css
|   |- script.js (createGame, joinGame)
|
|- /about/
|   |- index.html
|   |- stylesheet.css
|   |- script.js (submitFeedback)
|
|- /game/
    |- logic.js (fetchData; submitName, submitMove, submitBegin; locateMove, identifyMove, enactMove, completeMove; beginRound; getAllPlayers, getActiveOpponents, resolveDrink, isRoundEnd, isGameEnd, shufflePile)
    |- index.html (buildPerson, buildTable)
    |- stylesheet.css
    |- script.js (buildPerson, buildTable, buildEverything; selectCard, unselectCard, moveCard; submitName, submitMove, submitBegin; fetchData)
</pre>
