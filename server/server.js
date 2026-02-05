const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 4;

/* =======================
  Static file server
======================= */

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif"
};

const server = http.createServer((req, res) => {
  const file = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(__dirname, "../public", file);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      return res.end("Not Found");
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
    });
    res.end(data);
  });
});

/* =======================
  WebSocket multi-room logic
======================= */

const wss = new WebSocket.Server({ server });
const rooms = {};

/* -------- Room utilities -------- */

function createRoom(roomId) {
  rooms[roomId] = {
    players: {},
    mushrooms: [],
    hostId: null,
    gameStarted: false,
    paused: false,
    timeLeft: 60
  };
  return rooms[roomId];
}

function getRoom(roomId) {
  return rooms[roomId] || createRoom(roomId);
}

function broadcastRoomState(roomId, message = null) {
  const room = rooms[roomId];
  if (!room) return;

  const payload = JSON.stringify({
    type: "state",
    players: room.players,
    mushrooms: room.mushrooms,
    timeLeft: room.timeLeft,
    paused: room.paused,
    gameStarted: room.gameStarted,
    hostId: room.hostId,
    message
  });

  wss.clients.forEach(ws => {
    if (ws.readyState === 1 && ws.roomId === roomId) {
      ws.send(payload);
    }
  });
}

function spawnMushroom() {
  return {
    id: Math.random().toString(36).slice(2),
    x: Math.random() * 760,
    y: Math.random() * 560
  };
}

function checkGameEnd(roomId) {
  const room = rooms[roomId];
  if (!room || !room.gameStarted) return;

  const players = Object.values(room.players);
  if (players.length === 1) {
    const winner = players[0];
    room.gameStarted = false;

    broadcastGameOver(roomId, [winner]);
  }
}

function broadcastGameOver(roomId, winners) {
  const room = rooms[roomId];
  wss.clients.forEach(ws => {
    if (ws.readyState === 1 && ws.roomId === roomId) {
      ws.send(JSON.stringify({
        type: "gameOver",
        winners: winners.map(p => ({
          name: p.name,
          score: p.score
        })),
        hostId: room.hostId 
      }));
    }
  });
}

function getWinners(players) {
  if (players.length === 0) return [];

  const maxScore = Math.max(...players.map(p => p.score));
  return players.filter(p => p.score === maxScore);
}

function getExistingRoom(roomId) {
  return rooms[roomId] || null;
}

/* -------- Timers (all rooms) -------- */

setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    if (!room.gameStarted || room.paused) return;

    room.timeLeft--;

    if (room.timeLeft <= 0) {
      room.gameStarted = false;

      const players = Object.values(room.players);
      if (players.length > 0) {
        const winners = getWinners(players);

        broadcastGameOver(roomId, winners);
      }
    }

    broadcastRoomState(roomId);
  });
}, 1000);

setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    if (room.gameStarted && !room.paused && room.mushrooms.length < 10) {
      room.mushrooms.push(spawnMushroom());
      broadcastRoomState(roomId);
    }
  });
}, 1000);

/* =======================
  WebSocket events
======================= */

wss.on("connection", ws => {
  const id = Math.random().toString(36).slice(2);
  ws.id = id;

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    /* ----- JOIN ----- */
    if (data.type === "join") {
      const roomId = data.roomId;
      let room = getExistingRoom(roomId);

      // ✅ If the room exists and a game is in progress, disallow joining
      if (room && room.gameStarted) {
        ws.send(JSON.stringify({
          type: "gameInProgress",
          message: "Game already in progress. Please wait for the next round."
        }));
        return;
      }

      // ✅ If the room doesn't exist, create it now
      if (!room) {
        room = createRoom(roomId);
      }

      if (Object.keys(room.players).length >= MAX_PLAYERS) {
        ws.send(JSON.stringify({
          type: "roomFull",
          message: "Room is full (max 4 players)"
        }));
        return;
      }
      
      ws.roomId = roomId;

      if (!room.hostId) {
        room.hostId = id;
        room.mushrooms = [];
        room.timeLeft = 60;
        room.gameStarted = false;
        room.paused = false;
      }

      room.players[id] = {
        id,
        name: data.name,
        x: Math.random() * 700,
        y: Math.random() * 500,
        score: 0
      };

      ws.send(JSON.stringify({
        type: "welcome",
        id
      }));

      broadcastRoomState(roomId, {
        text: `${data.name} joined room ${roomId}`
      });
    }

    /* ----- START ----- */
    if (data.type === "start") {
      const room = rooms[ws.roomId];
      if (!room || room.hostId !== id) return;

      room.gameStarted = true;
      room.paused = false;
      room.timeLeft = 60;
      room.mushrooms = [];
      Object.values(room.players).forEach(p => p.score = 0);

      broadcastRoomState(ws.roomId, { text: "Game started" });
    }

    /* ----- PAUSE / RESUME ----- */
    if (data.type === "pause") {
      const room = rooms[ws.roomId];
      if (!room) return;
      room.paused = true;
      broadcastRoomState(ws.roomId, {
        text: `${room.players[id].name} paused the game`
      });
    }

    if (data.type === "resume") {
      const room = rooms[ws.roomId];
      if (!room) return;
      room.paused = false;
      broadcastRoomState(ws.roomId, {
        text: `${room.players[id].name} resumed the game`
      });
    }

    /* ----- MOVE ----- */
    if (data.type === "move") {
      const room = rooms[ws.roomId];
      if (!room || !room.gameStarted || room.paused) return;

      const p = room.players[id];
      if (!p) return;

      p.x = Math.max(0, Math.min(760, p.x + data.dx));
      p.y = Math.max(0, Math.min(560, p.y + data.dy));

      room.mushrooms = room.mushrooms.filter(m => {
        const hit = Math.abs(p.x - m.x) < 25 &&
                    Math.abs(p.y - m.y) < 25;
        if (hit) p.score++;
        return !hit;
      });

      broadcastRoomState(ws.roomId);
    }

    /* ----- QUIT ----- */
    if (data.type === "quit") {
      ws.close();
    }
  });

  /* ----- DISCONNECT ----- */
  ws.on("close", () => {
    const roomId = ws.roomId;
    const room = rooms[roomId];
    if (!room || !room.players[id]) return;

    const name = room.players[id].name;
    delete room.players[id];

    if (room.hostId === id) {
      room.hostId = Object.keys(room.players)[0] || null;
    }

    if (Object.keys(room.players).length === 0) {
      delete rooms[roomId];
      return;
    }

    broadcastRoomState(roomId, { text: `${name} left the room` });
    checkGameEnd(roomId);
  });
});

/* ======================= */

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});