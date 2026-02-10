# Game Lobby Implementation

## Overview
This game allows players to create game lobbies with unique codes. Players can click the Play button to generate a lobby code for joining games.

## Play Button Functionality
The Play button initiates the creation of a new game lobby. When clicked, it generates a random lobby code for the player to share with friends for joining the game.

## Implementation
Here is a simple implementation:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Lobby</title>
    <script>
        function generateLobbyCode() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        }

        function createLobby() {
            const lobbyCode = generateLobbyCode();
            document.getElementById('lobby-code').innerText = `Lobby Code: ${lobbyCode}`;
        }
    </script>
</head>
<body>
    <h1>Welcome to the Game Lobby</h1>
    <button onclick="createLobby()">Play</button>
    <p id="lobby-code"></p>
</body>
</html>
```