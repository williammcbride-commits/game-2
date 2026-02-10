const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store lobby information
let lobbies = {};

app.get('/', (req, res) => {
    res.send('Lobby System');
});

io.on('connection', (socket) => {
    console.log('New client connected');

    // Join a lobby
    socket.on('joinLobby', ({ lobbyCode, playerName }) => {
        if (!lobbies[lobbyCode]) {
            lobbies[lobbyCode] = { players: [] };
        }
        lobbies[lobbyCode].players.push(playerName);
        socket.join(lobbyCode);
        io.to(lobbyCode).emit('lobbyUpdate', lobbies[lobbyCode]);
        console.log(`${playerName} joined lobby ${lobbyCode}`);
    });

    // Leave a lobby
    socket.on('leaveLobby', ({ lobbyCode, playerName }) => {
        if (lobbies[lobbyCode]) {
            lobbies[lobbyCode].players = lobbies[lobbyCode].players.filter(player => player !== playerName);
            socket.leave(lobbyCode);
            io.to(lobbyCode).emit('lobbyUpdate', lobbies[lobbyCode]);
            console.log(`${playerName} left lobby ${lobbyCode}`);
        }
    });

    // Handle game state
    socket.on('updateGameState', ({ lobbyCode, state }) => {
        io.to(lobbyCode).emit('gameStateUpdate', state);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});