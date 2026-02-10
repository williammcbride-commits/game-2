// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {};

app.use(express.static('public'));

app.get('/createRoom', (req, res) => {
    const roomCode = Math.random().toString(36).substring(2, 8);
    rooms[roomCode] = { players: [], host: '' };
    res.json({ roomCode });
});

io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomCode, nickname }) => {
        socket.join(roomCode);
        rooms[roomCode].players.push(nickname);
        io.to(roomCode).emit('playerUpdate', rooms[roomCode].players);
    });

    socket.on('host', (roomCode) => {
        rooms[roomCode].host = socket.id;
    });

    socket.on('disconnect', () => {
        for (let roomCode in rooms) {
            const index = rooms[roomCode].players.indexOf(socket.id);
            if (index !== -1) {
                rooms[roomCode].players.splice(index, 1);
                io.to(roomCode).emit('playerUpdate', rooms[roomCode].players);
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Game Lobby</title>
    <script src="https://cdn.socket.io/4.0.0/socket.io.min.js"></script>
    <script>
        let socket;
        let roomCode;

        function createRoom() {
            fetch('/createRoom').then(res => res.json()).then(data => {
                roomCode = data.roomCode;
                document.getElementById('lobby').innerText = `Room Code: ${roomCode}`;
            });
        }

        function joinRoom() {
            const nickname = document.getElementById('nickname').value;
            socket = io();
            socket.emit('joinRoom', { roomCode, nickname });
            document.getElementById('game').style.display = 'block';
        }

        window.onload = () => {
            createRoom();
            socket = io();
        };
    </script>
</head>
<body>
    <div id="starter">
        <h1>Welcome to the Game!</h1>
        <input type="text" id="nickname" placeholder="Enter your nickname" />
        <button onclick="joinRoom()">Play</button>
    </div>
    <div id="lobby"></div>
    <div id="game" style="display:none;">
        <!-- Game Screen Content -->
    </div>
</body>
</html>
