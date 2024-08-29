// public/script.js

const socket = io();

let isSelector = false;
let currentSessionCode = null;

// DOM Elements
const loginForm = document.getElementById('loginForm');
const lobbyArea = document.getElementById('lobbyArea');
const gameArea = document.getElementById('gameArea');
const playerList = document.getElementById('playerList');
const readyButton = document.getElementById('readyButton');
const scoreBoard = document.getElementById('scoreBoard');
const selectorArea = document.getElementById('selectorArea');
const guesserArea = document.getElementById('guesserArea');
const messages = document.getElementById('messages');

// Game Creation and Joining
function createGame() {
    const playerName = document.getElementById('playerName').value;
    const rounds = document.getElementById('rounds').value;
    if (playerName && rounds) {
        socket.emit('createGame', { playerName, rounds });
    }
}

function joinGame() {
    const playerName = document.getElementById('playerName').value;
    const sessionCode = document.getElementById('sessionCode').value;
    if (playerName && sessionCode) {
        socket.emit('joinGame', { playerName, sessionCode });
    }
}

// Lobby Functions
function toggleReady() {
    socket.emit('toggleReady');
    readyButton.textContent = readyButton.textContent === 'Ready' ? 'Not Ready' : 'Ready';
}

// Game Functions
function searchSong() {
    const query = document.getElementById('songSearch').value;
    socket.emit('searchSong', query);
}

function selectSong() {
    const songId = document.getElementById('selectedSong').dataset.songId;
    const startTime = document.getElementById('startTime').value;
    const duration = document.getElementById('duration').value;
    if (songId && startTime && duration) {
        socket.emit('selectSong', { songId, startTime, duration });
    }
}

function submitGuess() {
    const guess = document.getElementById('guessInput').value;
    if (guess) {
        socket.emit('submitGuess', guess);
        document.getElementById('guessInput').value = '';
    }
}

function sendMessage() {
    const message = document.getElementById('chatInput').value;
    if (message) {
        socket.emit('chatMessage', message);
        document.getElementById('chatInput').value = '';
    }
}

// UI Updates
function updatePlayerList(players) {
    playerList.innerHTML = players.map(player => 
        `<div>${player.name} ${player.ready ? '(Ready)' : '(Not Ready)'}</div>`
    ).join('');
}

function updateScoreboard(scores) {
    scoreBoard.innerHTML = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .map(([name, score], index) => `<div>${index + 1}. ${name}: ${score}</div>`)
        .join('');
}

function displayMessage(message) {
    messages.innerHTML += `<div>${message}</div>`;
    messages.scrollTop = messages.scrollHeight;
}

function selectSearchResult(id, name) {
    const selectedSong = document.getElementById('selectedSong');
    selectedSong.textContent = name;
    selectedSong.dataset.songId = id;
}

// Socket Event Listeners
socket.on('gameCreated', (sessionCode) => {
    currentSessionCode = sessionCode;
    loginForm.style.display = 'none';
    lobbyArea.style.display = 'block';
    document.getElementById('currentSessionCode').textContent = sessionCode;
});

socket.on('gameJoined', (sessionCode) => {
    currentSessionCode = sessionCode;
    loginForm.style.display = 'none';
    lobbyArea.style.display = 'block';
    document.getElementById('currentSessionCode').textContent = sessionCode;
});

socket.on('updateLobby', (players) => {
    updatePlayerList(players);
});

socket.on('gameStart', ({ round, selector }) => {
    lobbyArea.style.display = 'none';
    gameArea.style.display = 'block';
    isSelector = selector === socket.id;
    selectorArea.style.display = isSelector ? 'block' : 'none';
    guesserArea.style.display = isSelector ? 'none' : 'block';
    displayMessage(`Round ${round} started. ${isSelector ? 'You are' : selector + ' is'} selecting the song.`);
});

socket.on('songSearchResults', (results) => {
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = results.map(song => 
        `<div onclick="selectSearchResult('${song.id}', '${song.name}')">${song.name} - ${song.artist}</div>`
    ).join('');
});

socket.on('songSelected', (songInfo) => {
    if (!isSelector) {
        displayMessage('The selector has chosen a song. Get ready to guess!');
        // Here you would typically start playing the audio
        // For example: playSong(songInfo);
    }
});

socket.on('roundEnd', ({ song, artist, guesses, scores }) => {
    displayMessage(`Round ended. The song was "${song}" by ${artist}`);
    Object.entries(guesses).forEach(([player, guess]) => {
        displayMessage(`${player} guessed: ${guess}`);
    });
    updateScoreboard(scores);
});

socket.on('gameEnd', (finalScores) => {
    gameArea.style.display = 'none';
    loginForm.style.display = 'block';
    updateScoreboard(finalScores);
    displayMessage('Game Over! Final Scores:');
});

socket.on('error', (errorMessage) => {
    alert(errorMessage);
});

document.addEventListener('DOMContentLoaded', function() {
    const sessionCodeSpan = document.getElementById('currentSessionCode');
    
    sessionCodeSpan.addEventListener('click', function() {
        const sessionCode = this.textContent;
        navigator.clipboard.writeText(sessionCode).then(function() {
            // Visual feedback
            sessionCodeSpan.style.backgroundColor = 'rgba(46, 204, 113, 0.4)';
            setTimeout(() => {
                sessionCodeSpan.style.backgroundColor = '';
            }, 200);
        });
    });
});

// Add event listeners for UI elements
document.getElementById('songSearch').addEventListener('input', searchSong);

// You might want to add more event listeners here for other UI elements