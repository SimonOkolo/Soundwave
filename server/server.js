const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Game = require('./game');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

const games = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('createGame', ({ playerName, rounds }) => {
    const game = new Game(rounds);
    const sessionCode = game.sessionCode;
    games.set(sessionCode, game);
    game.addPlayer(playerName, socket.id);
    socket.join(sessionCode);
    socket.playerName = playerName;
    socket.sessionCode = sessionCode;
    socket.emit('gameCreated', sessionCode);
    io.to(sessionCode).emit('updateLobby', game.getPlayersList());
  });

  socket.on('joinGame', ({ playerName, sessionCode }) => {
    if (games.has(sessionCode)) {
      const game = games.get(sessionCode);
      if (!game.inProgress) {
        game.addPlayer(playerName, socket.id);
        socket.join(sessionCode);
        socket.playerName = playerName;
        socket.sessionCode = sessionCode;
        socket.emit('gameJoined', sessionCode);
        io.to(sessionCode).emit('updateLobby', game.getPlayersList());
      } else {
        socket.emit('error', 'Game already in progress');
      }
    } else {
      socket.emit('error', 'Invalid session code');
    }
  });

  socket.on('toggleReady', () => {
    if (socket.sessionCode) {
      const game = games.get(socket.sessionCode);
      if (game && !game.inProgress) {
        game.togglePlayerReady(socket.playerName);
        io.to(socket.sessionCode).emit('updateLobby', game.getPlayersList());
        
        if (game.allPlayersReady() && game.players.size > 1) {
          game.start();
          io.to(socket.sessionCode).emit('gameStart', game.getCurrentRoundInfo());
        }
      }
    }
  });

  socket.on('searchSong', (query) => {
    const results = spotifyMock.search(query);
    socket.emit('songSearchResults', results);
  });

  socket.on('selectSong', ({ songId, startTime, duration }) => {
    const game = games.get(socket.sessionCode);
    if (game && game.currentSelector === socket.playerName) {
      game.setCurrentSong(songId, startTime, duration);
      io.to(socket.sessionCode).emit('songSelected', game.getCurrentSongInfo());
    }
  });

  socket.on('submitGuess', (guess) => {
    const game = games.get(socket.sessionCode);
    if (game && game.inProgress && game.currentSelector !== socket.playerName) {
      game.submitGuess(socket.playerName, guess);
      if (game.allGuessesSubmitted()) {
        const roundResults = game.endRound();
        io.to(socket.sessionCode).emit('roundEnd', roundResults);
        
        if (game.isGameOver()) {
          io.to(socket.sessionCode).emit('gameEnd', game.getFinalScores());
          games.delete(socket.sessionCode);
        } else {
          setTimeout(() => {
            game.nextRound();
            io.to(socket.sessionCode).emit('newRound', game.getCurrentRoundInfo());
          }, 5000);
        }
      }
    }
  });

  socket.on('disconnect', () => {
    if (socket.sessionCode) {
      const game = games.get(socket.sessionCode);
      if (game) {
        game.removePlayer(socket.playerName);
        io.to(socket.sessionCode).emit('updateLobby', game.getPlayersList());
        
        if (game.players.size < 2) {
          io.to(socket.sessionCode).emit('gameCancelled', 'Not enough players');
          games.delete(socket.sessionCode);
        } else if (game.inProgress && game.currentSelector === socket.playerName) {
          game.nextRound();
          io.to(socket.sessionCode).emit('newRound', game.getCurrentRoundInfo());
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));