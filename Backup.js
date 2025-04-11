import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const server = createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static('public')); // Statische Dateien aus dem 'public'-Ordner bereitstellen

// ========================
// Spiellogik
// ========================

const players = {}; // Spielerobjekte
const projectiles = []; // Projektile
const walls = [
    { x: 300, y: 200, width: 10, height: 400 },  // Hindernis R1
    { x: 1200 -10, y: 200, width: 10, height: 400 },  // Hindernis B1
    { x: 700, y: 350, width: 10, height: 100 },  // Hindernis R2a
    { x: 800 -10, y: 350, width: 10, height: 100 },  // Hindernis B2
    { x: 700, y: 200, width: 100, height: 10 },  // Hindernis R3
    { x: 700, y: 600 -10 , width: 100, height: 10 },  // Hindernis B3a

];

const redSpawn = { x: 100, y: 400, width: 200, height: 200 }; // Rote Spawnzone
const blueSpawn = { x: 1400, y: 400, width: 200, height: 200 }; // Blaue Spawnzone

const flag = { x: 750, y: 400, holder: null }; // Flagge in der Mitte des Spielfelds
const score = { red: 0, blue: 0 }; // Punktestand

const border = { x: 0, y: 0, width: 1500, height: 800 }; // Spielfeldgrenzen

// ========================
// Hilfsfunktionen
// ========================

// Wand- und Grenzkollision prüfen
function checkCollision(x, y, width, height, walls) {
    return walls.some(wall =>
        x < wall.x + wall.width &&
        x + width > wall.x &&
        y < wall.y + wall.height &&
        y + height > wall.y
    );
}

// Überprüfe, ob der Spieler innerhalb der Spielfeldgrenzen ist
function checkBorderCollision(x, y, width, height) {
    return x >= border.x && x <= border.x + border.width - width && y >= border.y && y <= border.y + border.height - height;
}

// ========================
// Socket.io Events
// ========================

io.on('connection', (socket) => {
    console.log('Neuer Spieler verbunden:', socket.id);

    // Spieler wählt ein Team (Rot oder Blau)
    socket.on('chooseTeam', (team) => {
        players[socket.id] = {
            x: team === 'red' ? redSpawn.x  : blueSpawn.x ,
            y: team === 'red' ? redSpawn.y  : blueSpawn.y ,
            team,
            hasFlag: false
        };

        socket.emit('teamChosen', team); // Sende die Bestätigung an den Spieler
    });

    // Bewegung des Spielers
    socket.on('move', (data) => {
        const player = players[socket.id];
        if (!player) return;

        const newX = player.x + data.dx;
        const newY = player.y + data.dy;

        // Überprüfe, ob der Spieler nicht in eine Wand oder aus der Grenze läuft
        if (!checkCollision(newX - 10, newY - 10, 20, 20, walls) && checkBorderCollision(newX, newY, 20, 20)) {
            player.x = newX;
            player.y = newY;
        }

        // Flagge aufheben, wenn der Spieler darüber läuft
        if (!flag.holder && Math.abs(player.x - flag.x) < 10 && Math.abs(player.y - flag.y) < 10) {
            flag.holder = socket.id;
            player.hasFlag = true;
        }
    });

    // Schießen
    socket.on('shoot', () => {
        const player = players[socket.id];
        if (!player) return;

        // Projektil hinzufügen
        projectiles.push({
            x: player.x,
            y: player.y,
            direction: player.team === 'red' ? 1 : -1,
            owner: socket.id
        });
    });

    // Spieler trennt die Verbindung
    socket.on('disconnect', () => {
        const player = players[socket.id];
        if (player && player.hasFlag) {
            // Flagge droppen bei Disconnect
            flag.x = player.x;
            flag.y = player.y;
            flag.holder = null;
        }
        delete players[socket.id];
        console.log('Spieler getrennt:', socket.id);
    });
});

// ========================
// Spiel-Loop
// ========================

setInterval(() => {
    // Projektile bewegen und auf Kollision prüfen
    projectiles.forEach((proj, index) => {
        proj.x += proj.direction * 5;

        // Wand-Kollision: Projektil verschwindet
        if (checkCollision(proj.x - 5, proj.y - 5, 10, 10, walls)) {
            projectiles.splice(index, 1);
            return;
        }

        // Spieler treffen
        for (const id in players) {
            const player = players[id];
            if (proj.owner !== id && Math.abs(proj.x - player.x) < 10 && Math.abs(proj.y - player.y) < 10) {
                // Spieler wird in die Spawnzone teleportiert
                player.x = player.team === 'red' ? redSpawn.x + 50 : blueSpawn.x + 50;
                player.y = player.team === 'red' ? redSpawn.y + 50 : blueSpawn.y + 50;

                // ✅ Flagge wird an der Trefferposition fallen gelassen
                if (player.hasFlag) {
                    flag.x = proj.x;   // Flagge fällt dort, wo der Spieler getroffen wurde
                    flag.y = proj.y;
                    flag.holder = null;
                    player.hasFlag = false;
                }

                projectiles.splice(index, 1); // Projektil löschen
                break;
            }
        }
    });

    // Punkte vergeben, wenn die Flagge in der Spawnzone ist
    for (const id in players) {
        const player = players[id];
        if (player.hasFlag) {
            const spawn = player.team === 'red' ? redSpawn : blueSpawn;

            if (
                player.x > spawn.x &&
                player.x < spawn.x + spawn.width &&
                player.y > spawn.y &&
                player.y < spawn.y + spawn.height
            ) {
                // Punkt für das Team hinzufügen
                score[player.team]++;
                flag.x = 750; // Flagge zurück in die Mitte
                flag.y = 400;
                flag.holder = null;
                player.hasFlag = false;

                // Spiel beenden, wenn das Team 3 Punkte erreicht hat
                if (score[player.team] === 3) {
                    io.emit('gameOver', player.team);
                }
            }
        }
    }

    // Spielstatus an alle Clients senden
    io.emit('state', { players, projectiles, walls, flag, score, redSpawn, blueSpawn });
}, 1000 / 60);

// ========================
// Server starten
// ========================

server.listen(PORT, () => {
    console.log(`✅ Server läuft auf http://localhost:${PORT}`);
});
