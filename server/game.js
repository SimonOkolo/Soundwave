const crypto = require('crypto');
const spotifyMock = require('./spotifyMock');

class Game {
  constructor(rounds) {
    this.sessionCode = this.generateSessionCode();
    this.players = new Map();
    this.rounds = rounds;
    this.currentRound = 0;
    this.inProgress = false;
    this.currentSelector = null;
    this.currentSong = null;
    this.guesses = new Map();
  }

  generateSessionCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  addPlayer(name, socketId) {
    this.players.set(name, { socketId, ready: false, score: 0 });
  }

  removePlayer(name) {
    this.players.delete(name);
  }

  togglePlayerReady(name) {
    const player = this.players.get(name);
    player.ready = !player.ready;
  }

  allPlayersReady() {
    return Array.from(this.players.values()).every(p => p.ready);
  }

  start() {
    this.inProgress = true;
    this.currentRound = 1;
    this.selectNewSelector();
  }

  selectNewSelector() {
    const players = Array.from(this.players.keys());
    this.currentSelector = players[Math.floor(Math.random() * players.length)];
  }

  setCurrentSong(songId, startTime, duration) {
    this.currentSong = {
      id: songId,
      startTime: startTime,
      duration: duration,
      ...spotifyMock.getSongDetails(songId)
    };
  }

  submitGuess(playerName, guess) {
    this.guesses.set(playerName, guess);
  }

  allGuessesSubmitted() {
    return this.guesses.size === this.players.size - 1; // Excluding the selector
  }

  endRound() {
    const correctGuesses = Array.from(this.guesses.values()).filter(guess => 
      guess.toLowerCase() === this.currentSong.name.toLowerCase()
    ).length;
    
    const guessRatio = correctGuesses / (this.players.size - 1);
    
    if (guessRatio === 0.5) {
      this.players.get(this.currentSelector).score++;
      this.guesses.forEach((guess, player) => {
        if (guess.toLowerCase() === this.currentSong.name.toLowerCase()) {
          this.players.get(player).score++;
        }
      });
    } else if (guessRatio > 0.5) {
      this.guesses.forEach((guess, player) => {
        if (guess.toLowerCase() === this.currentSong.name.toLowerCase()) {
          this.players.get(player).score++;
        }
      });
    }
    
    const roundResults = {
      song: this.currentSong.name,
      artist: this.currentSong.artist,
      guesses: Object.fromEntries(this.guesses),
      scores: this.getScores()
    };
    
    this.guesses.clear();
    return roundResults;
  }

  nextRound() {
    this.currentRound++;
    this.selectNewSelector();
    this.currentSong = null;
  }

  isGameOver() {
    return this.currentRound > this.rounds;
  }

  getScores() {
    return Object.fromEntries(Array.from(this.players.entries()).map(([name, data]) => [name, data.score]));
  }

  getFinalScores() {
    return this.getScores();
  }

  getPlayersList() {
    return Array.from(this.players.entries()).map(([name, data]) => ({ name, ready: data.ready }));
  }

  getCurrentRoundInfo() {
    return {
      round: this.currentRound,
      selector: this.currentSelector
    };
  }

  getCurrentSongInfo() {
    return {
      id: this.currentSong.id,
      startTime: this.currentSong.startTime,
      duration: this.currentSong.duration
    };
  }
}

module.exports = Game;