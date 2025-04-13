"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.armors = void 0;
exports.checkBorderCollision = checkBorderCollision;
exports.checkCollision = checkCollision;
exports.server = exports.score = exports.projectileUpdateInterval = exports.players = exports.medikits = exports.io = exports.flag = void 0;
var _express = _interopRequireDefault(require("express"));
var _http = require("http");
var _socket = require("socket.io");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
var app = (0, _express["default"])();
var server = exports.server = (0, _http.createServer)(app);
var io = exports.io = new _socket.Server(server);
var PORT = 3000;
app.use(_express["default"]["static"]('public'));

// ========================
// Spiellogik Variablen
// ========================
var players = exports.players = {};
var projectiles = [];
var walls = [{
  x: 300,
  y: 200,
  width: 10,
  height: 400
}, {
  x: 1200 - 10,
  y: 200,
  width: 10,
  height: 400
}, {
  x: 700,
  y: 350,
  width: 10,
  height: 100
}, {
  x: 800 - 10,
  y: 350,
  width: 10,
  height: 100
}, {
  x: 700,
  y: 200,
  width: 100,
  height: 10
}, {
  x: 700,
  y: 600 - 10,
  width: 100,
  height: 10
}];
var redSpawn = {
  x: 100,
  y: 400,
  width: 200,
  height: 200
};
var blueSpawn = {
  x: 1400,
  y: 400,
  width: 200,
  height: 200
};
var flag = exports.flag = {
  x: 750,
  y: 400,
  holder: null
};
var score = exports.score = {
  red: 0,
  blue: 0
};
var border = {
  x: 0,
  y: 0,
  width: 1500,
  height: 800
};
var chatMessages = [];

// ========================
// Hilfsfunktionen
// ========================
function checkCollision(x, y, width, height, walls) {
  return walls.some(function (wall) {
    return x < wall.x + wall.width && x + width > wall.x && y < wall.y + wall.height && y + height > wall.y;
  });
}
function checkBorderCollision(x, y, width, height) {
  return x >= border.x && x <= border.x + border.width - width && y >= border.y && y <= border.y + border.height - height;
}

// ========================
// Socket.io Events
// ========================
io.on('connection', function (socket) {
  console.log('Neuer Spieler verbunden:', socket.id);
  socket.emit('chatUpdate', chatMessages);
  socket.emit('updateMedikits', medikits); // Medikits an neuen Spieler senden
  socket.emit('updateArmors', armors); // Armors an neuen Spieler senden

  socket.on('chooseTeam', function (data) {
    console.log("📢 Empfangen: ", data);
    var _ref = data || {},
      username = _ref.username,
      team = _ref.team;
    if (!username || !team) {
      console.error("❌ Fehler: `username` oder `team` ist undefined!", {
        username: username,
        team: team
      });
      return;
    }
    players[socket.id] = {
      x: team === 'red' ? redSpawn.x : blueSpawn.x,
      y: team === 'red' ? redSpawn.y : blueSpawn.y,
      team: team,
      username: username,
      hasFlag: false,
      health: 2,
      // 🛡 Spieler hat 2 Leben
      armor: 0 // 🛡 Rüstung (maximal 1)
    };
    console.log("\uD83D\uDCE2 ".concat(username, " ist Team ").concat(team.toUpperCase(), " beigetreten!"));
    chatMessages.push("\uD83D\uDCE2 ".concat(username, " ist Team ").concat(team.toUpperCase(), " beigetreten!"));
    io.emit('chatUpdate', chatMessages);

    // **Spielstatus an alle senden**
    io.emit('state', {
      players: players,
      projectiles: projectiles,
      walls: walls,
      flag: flag,
      score: score,
      redSpawn: redSpawn,
      blueSpawn: blueSpawn,
      medikits: medikits
    });
  });

  // **Fix für socket.on('move')**
  socket.on('move', function (data) {
    var player = players[socket.id];
    if (!player) return;
    var newX = player.x + data.dx;
    var newY = player.y + data.dy;
    if (!checkCollision(newX - 10, newY - 10, 20, 20, walls) && checkBorderCollision(newX, newY, 20, 20)) {
      player.x = newX;
      player.y = newY;
    }
    if (!flag.holder && Math.abs(player.x - flag.x) < 20 && Math.abs(player.y - flag.y) < 20) {
      // Abstand von 20 statt 15
      flag.holder = socket.id;
      player.hasFlag = true;
      console.log("\uD83D\uDEA9 ".concat(player.username, " hat die Flagge aufgenommen!"));
      io.emit('chatMessage', "\uD83D\uDEA9 ".concat(player.username, " hat die Flagge aufgenommen!"));
    }

    // **🏁 Flagge ins Ziel bringen**
    var spawn = player.team === 'red' ? redSpawn : blueSpawn;
    if (player.hasFlag && player.x > spawn.x && player.x < spawn.x + spawn.width && player.y > spawn.y && player.y < spawn.y + spawn.height) {
      score[player.team]++;
      console.log("\uD83C\uDFC6 Punkt f\xFCr Team ".concat(player.team.toUpperCase()));

      // Flagge zurücksetzen
      flag.x = 750;
      flag.y = 400;
      flag.holder = null;
      player.hasFlag = false;
      io.emit('chatMessage', "\uD83C\uDF89 ".concat(player.username, " hat einen Punkt f\xFCr Team ").concat(player.team.toUpperCase(), " erzielt!"));

      // **Spiel beenden, wenn 3 Punkte erreicht sind**
      if (score[player.team] === 3) {
        io.emit('gameOver', player.team);
        // 🔄 **Score zurücksetzen**
        score.red = 0;
        score.blue = 0;
        io.emit('state', {
          players: players,
          projectiles: projectiles,
          walls: walls,
          flag: flag,
          score: score,
          redSpawn: redSpawn,
          blueSpawn: blueSpawn,
          medikits: medikits,
          armors: armors
        });
      }
    }

    // **Medikit aufnehmen und heilen**
    medikits.forEach(function (medikit) {
      if (medikit.active && Math.abs(player.x - medikit.x) < 10 && Math.abs(player.y - medikit.y) < 10) {
        if (player.health < 2) {
          // ⚕ Nur heilen, wenn nicht schon max HP
          player.health = 2;
          console.log("\u2764\uFE0F ".concat(player.username, " hat sich geheilt!"));
          io.emit('chatMessage', "\u2764\uFE0F ".concat(player.username, " hat sich geheilt!"));
        }
        medikit.active = false;
        io.emit('updateMedikits', medikits);
      }
    });

    // **Rüstung aufnehmen (falls nicht bereits vorhanden)**
    armors.forEach(function (armor) {
      if (armor.active && Math.abs(player.x - armor.x) < 10 && Math.abs(player.y - armor.y) < 10) {
        if (player.armor === 0) {
          // ❌ Kein Doppelsammeln möglich
          player.armor = 1;
          console.log("\uD83D\uDEE1 ".concat(player.username, " hat R\xFCstung aufgenommen!"));
          io.emit('chatMessage', "\uD83D\uDEE1 ".concat(player.username, " hat R\xFCstung aufgenommen!"));
        }
        armor.active = false;
        io.emit('updateArmors', armors);
      }
    });

    // Spielstatus aktualisieren
    io.emit('state', {
      players: players,
      projectiles: projectiles,
      walls: walls,
      flag: flag,
      score: score,
      redSpawn: redSpawn,
      blueSpawn: blueSpawn,
      medikits: medikits,
      armors: armors
    });
  });

  // **Chat-Nachrichten empfangen**
  socket.on('chatMessage', function (msg) {
    if (!players[socket.id]) return;
    var message = "".concat(players[socket.id].username, ": ").concat(msg);
    chatMessages.push(message);
    io.emit('chatUpdate', chatMessages);
  });

  // **Schießen**
  socket.on('shoot', function (data) {
    var player = players[socket.id];
    if (!player) return;
    projectiles.push({
      x: player.x,
      y: player.y,
      vx: Math.cos(data.angle) * 5,
      vy: Math.sin(data.angle) * 5,
      owner: socket.id
    });
    io.emit('state', {
      players: players,
      projectiles: projectiles,
      walls: walls,
      flag: flag,
      score: score,
      redSpawn: redSpawn,
      blueSpawn: blueSpawn,
      medikits: medikits,
      armors: armors
    });
  });

  // **Spieler trennt Verbindung**
  socket.on('disconnect', function () {
    if (players[socket.id]) {
      var leaveMessage = "\u274C ".concat(players[socket.id].username, " hat das Spiel verlassen.");
      chatMessages.push(leaveMessage);
      io.emit('chatUpdate', chatMessages);
      delete players[socket.id];
    }
    console.log('Spieler getrennt:', socket.id);
    io.emit('state', {
      players: players,
      projectiles: projectiles,
      walls: walls,
      flag: flag,
      score: score,
      redSpawn: redSpawn,
      blueSpawn: blueSpawn,
      medikits: medikits,
      armors: armors
    });
  });
});
var projectileUpdateInterval = exports.projectileUpdateInterval = setInterval(function () {
  projectiles.forEach(function (proj, index) {
    proj.x += proj.vx;
    proj.y += proj.vy;
    if (checkCollision(proj.x - 5, proj.y - 5, 10, 10, walls)) {
      projectiles.splice(index, 1);
      return;
    }
    for (var id in players) {
      var player = players[id];
      if (proj.owner !== id && Math.abs(proj.x - player.x) < 10 && Math.abs(proj.y - player.y) < 10) {
        if (player.armor > 0) {
          player.armor -= 1; // 🛡 Erst Rüstung abziehen
          console.log("\uD83D\uDEE1 ".concat(player.username, " wurde getroffen! R\xFCstung verloren!"));
          io.emit('chatMessage', "\uD83D\uDEE1 ".concat(player.username, " wurde getroffen! R\xFCstung verloren!"));
        } else {
          player.health -= 1; // ❤️ Dann Leben abziehen
          console.log("\uD83D\uDD25 ".concat(player.username, " wurde getroffen! Leben: ").concat(player.health));
          io.emit('chatMessage', "\uD83D\uDD25 ".concat(player.username, " wurde getroffen! Leben: ").concat(player.health));
        }
        if (player.health <= 0) {
          console.log("\uD83D\uDC80 ".concat(player.username, " wurde eliminiert!"));
          io.emit('chatMessage', "\uD83D\uDC80 ".concat(player.username, " wurde eliminiert!"));
          player.x = player.team === 'red' ? redSpawn.x + 50 : blueSpawn.x + 50;
          player.y = player.team === 'red' ? redSpawn.y + 50 : blueSpawn.y + 50;
          player.health = 2; // 🔄 Leben wieder voll
          player.armor = 0; // ❌ Keine Rüstung nach Respawn

          if (player.hasFlag) {
            flag.x = proj.x;
            flag.y = proj.y;
            flag.holder = null;
            player.hasFlag = false;
          }
        }
        projectiles.splice(index, 1);
        break;
      }
    }
  });
  io.emit('state', {
    players: players,
    projectiles: projectiles,
    walls: walls,
    flag: flag,
    score: score,
    redSpawn: redSpawn,
    blueSpawn: blueSpawn,
    medikits: medikits,
    armors: armors
  });
}, 1000 / 60);

// Medikit-Konfiguration
var medikits = exports.medikits = [{
  x: 750,
  y: 100,
  active: true
}, {
  x: 750,
  y: 700,
  active: true
} // Position in der Mitte unten und oben
];
//Rüstung
var armors = exports.armors = [{
  x: 350,
  y: 400,
  active: true
},
// Links an der rechten Seite der linken Wand
{
  x: 1150,
  y: 400,
  active: true
} // Rechts an der linken Seite der rechten Wand
];

// Respawn-Mechanismus für Medikits
setInterval(function () {
  medikits.forEach(function (medikit) {
    return medikit.active = true;
  });
  io.emit('updateMedikits', medikits);
}, 45000); // 45 Sekunden

// Respawn-Mechanismus für Rüstung
setInterval(function () {
  armors.forEach(function (armor) {
    return armor.active = true;
  });
  io.emit('updateArmors', armors);
}, 45000); // 45 Sekunden

// 👈 Hier exportieren

server.listen(PORT, function () {
  console.log("\u2705 Server l\xE4uft auf http://localhost:".concat(PORT));
});