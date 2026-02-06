## 🍄 Mushroom Rush
Mushroom Rush is a real-time multiplayer web game developed as a university coursework project.
Players compete simultaneously to collect mushrooms on a grass field.
The player (or players) with the highest score when the timer ends wins.

The game is built using HTML, CSS, and Vanilla JavaScript, with a Node.js + WebSocket backend.
All rendering is done using DOM elements (no canvas), and the game runs at a smooth 60 FPS using requestAnimationFrame.

## 🎮 Game Features
✅ Real-time multiplayer gameplay (2–4 players per room)
✅ Multiple independent game rooms
✅ Equal player abilities (fair gameplay)
✅ Resource gathering (mushroom collection)
✅ Live score updates for all players
✅ Game timer (countdown)
✅ Pause / Resume / Quit menu (ESC key)
✅ Player join and leave handling
✅ Automatic host reassignment
✅ Winner or Tie detection
✅ Smooth animations (60 FPS, DOM-based)
✅ Keyboard controls (WASD / Arrow keys)

## 🕹️ How to Play
1. Open the game URL in a web browser.
2. Enter:
    - A player name
    - A room ID (players with the same room ID join the same game)
3. Click Join.
4. The first player in a room becomes the host.
5. The host clicks Start to begin the game.
6. Collect as many mushrooms as possible before the timer ends.
7. When time runs out:
    - The player with the highest score wins.
    - If multiple players have the same highest score, the game results in a tie.

## ⌨️ Controls
Key	Action
W / ↑	Move up
S / ↓	Move down
A / ←	Move left
D / →	Move right
ESC	Open in-game menu

## 🧩 Game Rules
- Each room supports a maximum of 4 players.
- All players move simultaneously in real time.
- Each mushroom collected increases the player's score by 1 point.
- Players may leave the game at any time.
- If only one player remains in a room, that player automatically wins.
- If multiple players have the highest score at the end of the timer, a tie is declared.

## 🧱 Project Structure
```
mushroom-rush/
│
├─ server/
│  ├─ server.js
│  └─ package.json
│
└─ public/
   ├─ index.html
   ├─ style.css
   ├─ client.js
   └─ assets/
      ├─ grass.jpg
      ├─ mushroom.png
      ├─ player1.png
      ├─ player2.png
      ├─ player3.png
      └─ player4.png
```

## ⚙️ Technologies Used
- Frontend
    - HTML5
    - CSS3
    - Vanilla JavaScript
    - DOM rendering (no Canvas)
- Backend
    - Node.js
    - WebSocket (ws library)

## 🚀 Running the Project Locally
1️⃣ Prerequisites
    - Node.js (version 16 or higher)
2️⃣ Install Dependencies
```
cd server
npm install
```
3️⃣ Start the Server
```
npm start
```
The server will start on:
```
http://localhost:3000
```
4️⃣ Open the Game
Open the following URL in 2–4 browser windows or different computers:
```
http://localhost:3000
```

## 🌍 Public Deployment
The game can be deployed to any cloud platform that supports Node.js and WebSockets.
Recommended platforms:
- Render
- Railway
- Fly.io
When deployed, all players can join the same game room using the public URL.

## Render URL (running now)
```
https://mushroomrush.onrender.com/
```

## 🌍 Playing Over the Internet
For quick public access and multiplayer testing, the game server can be exposed to the internet using **Cloudflare Tunnel**.

### Steps
1. Start the local server:
2. In a separate terminal, run:
```
cloudflared tunnel --url http://localhost:3000
```
3. Cloudflare will generate a public HTTPS URL, for example:
```
https://example.trycloudflare.com
https://teams-aaron-strongly-laboratory.trycloudflare.com/
```
4. Share this URL with other players.
Players using the same room ID will join the same game session.

### Note: The public URL remains active only while the tunnel process is running.

## 🧠 Technical Notes
- The server maintains an authoritative game state.
- Each room has its own isolated game session.
- Game updates are synchronized using WebSockets.
- Rendering is optimized using transform: translate() and requestAnimationFrame.
- No canvas or external rendering libraries are used.

## ✅ Coursework Requirements Coverage
This project satisfies all functional requirements:
- ✔ 2–4 simultaneous players
- ✔ Real-time (non turn-based) gameplay
- ✔ Competitive interaction
- ✔ Web-based multiplayer access
- ✔ DOM-based rendering
- ✔ Smooth animation at 60 FPS
- ✔ In-game menu with pause/resume/quit
- ✔ Scoring system and winner display
- ✔ Game timer
- ✔ Keyboard controls

## 📄 License
This project is created for educational purposes as part of a university assignment.

## 👤 Author
Developed by 
- Binyang Shuai
- Bangzhu Wei
- Yuanjun Zhou

