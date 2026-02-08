const ws = new WebSocket(
  location.protocol === "https:"
    ? `wss://${location.host}`
    : `ws://${location.host}`
);

const join = document.getElementById("join");
const game = document.getElementById("game");
const joinBtn = document.getElementById("joinBtn");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const nameInput = document.getElementById("name");
const roomInput = document.getElementById("roomId");
const field = document.getElementById("field");
const scores = document.getElementById("scores");
const timer = document.getElementById("timer");
const msg = document.getElementById("message");
const playerInfo = document.getElementById("playerInfo");
const menu = document.getElementById("menu");
const winnerBox = document.getElementById("winner");
const winnerText = document.getElementById("winnerText");
const playAgainBtn = document.getElementById("playAgainBtn");
const fpsDisplay = document.getElementById("fps");

let keys = {};
let paused = false;
let myId = null;
let currentPlayerCount = 0;
let localPlayer = { x: 0, y: 0 }; // Track local player position

// FPS counter
let frameCount = 0;
let lastTime = performance.now();
let fps = 0;

const avatars = [
  "assets/player1.png",
  "assets/player2.png",
  "assets/player3.png",
  "assets/player4.png"
];

document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    menu.classList.toggle("hidden");
    ws.send(JSON.stringify({ type: paused ? "resume" : "pause" }));
    paused = !paused;
  }
  keys[e.key] = true;
});

document.addEventListener("keyup", e => keys[e.key] = false);

menuResume.onclick = () => {
  menu.classList.add("hidden");
  ws.send(JSON.stringify({ type: "resume" }));
  paused = false;
};

menuQuit.onclick = () => {
  ws.send(JSON.stringify({ type: "quit" }));
  ws.close();
  location.reload();
};

joinBtn.onclick = () => {
  const playerName = nameInput.value.trim();
  const roomId = roomInput.value.trim();
  if (!playerName) {
    alert("Please enter your name");
    return;
  }
  if (!roomId) {
    alert("Please enter your roomId");
    return;
  }

  // Send trimmed values and wait for server confirmation (welcome)
  joinBtn.disabled = true;
  msg.textContent = "Joining...";

  ws.send(JSON.stringify({
    type: "join",
    name: playerName,
    roomId: roomId
  }));
};

startBtn.onclick = () => {
  if (currentPlayerCount < 2 || currentPlayerCount > 4) {
    alert(`Need 2-4 players to start. Current: ${currentPlayerCount}`);
    return;
  }
  ws.send(JSON.stringify({ type: "start" }));
};
pauseBtn.onclick = () => ws.send(JSON.stringify({ type: "pause" }));
resumeBtn.onclick = () => ws.send(JSON.stringify({ type: "resume" }));

playAgainBtn.onclick = () => {
  ws.send(JSON.stringify({ type: "start" }));
};

function loop() {
  // Calculate FPS
  frameCount++;
  const currentTime = performance.now();
  const elapsed = currentTime - lastTime;
  
  if (elapsed >= 1000) {
    fps = Math.round(frameCount * 1000 / elapsed);
    fpsDisplay.textContent = `FPS: ${fps}`;
    frameCount = 0;
    lastTime = currentTime;
  }

  if (!paused) {
    let dx = 0, dy = 0;
    if (keys.w || keys.ArrowUp) dy -= 3;
    if (keys.s || keys.ArrowDown) dy += 3;
    if (keys.a || keys.ArrowLeft) dx -= 3;
    if (keys.d || keys.ArrowRight) dx += 3;

    if (dx || dy) {
      // Update local position immediately
      localPlayer.x += dx;
      localPlayer.y += dy;
      ws.send(JSON.stringify({ type: "move", dx, dy }));
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

ws.onmessage = e => {
  const data = JSON.parse(e.data);

  if (data.type === "host" && data.isHost)
    startBtn.hidden = false;

  if (data.type === "state") {
    if (data.gameStarted) {
      winnerBox.classList.add("hidden");
      playAgainBtn.hidden = true;
    }
    field.innerHTML = "";
    scores.innerHTML = "";
    timer.textContent = `Time: ${data.timeLeft}`;
    if (data.message?.text) msg.textContent = data.message.text;

    const players = Object.entries(data.players);
    currentPlayerCount = players.length;

    players.forEach(([id, p], i) => {
      const d = document.createElement("div");
      d.className = "player";
      
      // Use local position for local player, server position for others
      const x = (id === myId) ? localPlayer.x : p.x;
      const y = (id === myId) ? localPlayer.y : p.y;
      
      d.style.transform = `translate(${x}px, ${y}px)`;
      d.style.backgroundImage = `url(${avatars[i % avatars.length]})`;
      field.appendChild(d);

      const li = document.createElement("li");
      li.textContent = `${p.name}: ${p.score}`;
      scores.appendChild(li);
    });
    
    // Sync local position with server to prevent drift
    if (myId && data.players[myId]) {
      const serverPos = data.players[myId];
      if (Math.abs(localPlayer.x - serverPos.x) > 10 || Math.abs(localPlayer.y - serverPos.y) > 10) {
        localPlayer.x = serverPos.x;
        localPlayer.y = serverPos.y;
      }
    }

    data.mushrooms.forEach(m => {
      const d = document.createElement("div");
      d.className = "mushroom";
      d.style.transform = `translate(${m.x}px, ${m.y}px)`;
      field.appendChild(d);
    });
    startBtn.hidden = !(data.hostId === myId && !data.gameStarted);

    if (myId && data.players[myId]) {
      const me = data.players[myId];
      const isHost = data.hostId === myId;

      playerInfo.textContent = isHost
        ? `Player: ${me.name} (Host)`
        : `Player: ${me.name}`;
    }

  }

  if (data.type === "gameOver") {
    const winners = data.winners;

    if (!winners || winners.length === 0) {
      winnerText.textContent = "No winner";
    } else if (winners.length === 1) {
      winnerText.textContent =
        `🏆 Winner: ${winners[0].name} (${winners[0].score} points)`;
    } else {
      const names = winners.map(w => w.name).join(" & ");
      winnerText.textContent =
        `🤝 Tie between ${names} (${winners[0].score} points)`;
    }
    if (myId && data.hostId === myId) {
      playAgainBtn.hidden = false;
    } else {
      playAgainBtn.hidden = true;
    }

    winnerBox.classList.remove("hidden");
  }

  if (data.type === "welcome") {
    myId = data.id;
    // Server accepted the join — show game UI
    join.hidden = true;
    game.hidden = false;
    joinBtn.disabled = false;
    msg.textContent = "";
    // Initialize local player position
    localPlayer = { x: 0, y: 0 };
  }

  if (data.type === "roomFull") {
    alert(data.message);
    ws.close();
    location.reload();
  }

  if (data.type === "gameInProgress") {
    alert(data.message);
    ws.close();
    location.reload();
  }

  // Name validation errors from server
  if (data.type === "nameTaken" || data.type === "invalidName") {
    alert(data.message || (data.type === "nameTaken" ? "Name already taken" : "Invalid name"));
    joinBtn.disabled = false;
    msg.textContent = "";
    nameInput.focus();
  }

  // Start game errors
  if (data.type === "startError") {
    alert(data.message);
  }

};