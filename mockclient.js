import { io } from 'socket.io-client';

class MockClient {
    constructor(url = 'http://localhost:3000') {
        this.socket = io(url);
        this.gameState = {
            players: {},
            projectiles: [],
            walls: [],
            flag: { x: 750, y: 400 },
            score: { red: 0, blue: 0 },
            medikits: [],
            armors: [],
            playerX: 0,
            playerY: 0,
            team: '',
            connected: false,
            ready: false
        };
        this.lastLog = '';
        this.setupListeners();
    }

    setupListeners() {
        this.socket.on('connect', () => {
            console.log('🔌 Verbunden mit Server');
            this.gameState.connected = true;
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Verbindung zum Server verloren');
            this.gameState.connected = false;
        });

        this.socket.on('state', state => {
            const oldHealth = this.gameState.players[this.socket.id]?.health;
            const oldArmor = this.gameState.players[this.socket.id]?.armor;
            const oldHasFlag = this.gameState.players[this.socket.id]?.hasFlag;
            const oldScore = this.gameState.score;
            
            Object.assign(this.gameState, state);
            
            if (this.socket.id in state.players) {
                this.gameState.playerX = state.players[this.socket.id].x;
                this.gameState.playerY = state.players[this.socket.id].y;
                const player = state.players[this.socket.id];

                if (!this.gameState.ready) {
                    console.log('✅ Spieler initialisiert');
                    this.gameState.ready = true;
                }
                
                if (oldHealth !== player.health) {
                    console.log(`❤️ Leben: ${player.health}`);
                }
                if (oldArmor !== player.armor) {
                    console.log(`🛡️ Rüstung: ${player.armor}`);
                }
                if (oldHasFlag !== player.hasFlag) {
                    console.log(player.hasFlag ? '🚩 Flagge aufgenommen!' : '🚩 Flagge verloren!');
                }
                if (state.score && (oldScore?.red !== state.score.red || oldScore?.blue !== state.score.blue)) {
                    console.log(`📊 Punktestand - Rot: ${state.score?.red || 0} | Blau: ${state.score?.blue || 0}`);
                }
            }
        });

        this.socket.on('chatUpdate', messages => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg !== this.lastLog) {
                console.log('💬', lastMsg);
                this.lastLog = lastMsg;
            }
        });

        this.socket.on('updateMedikits', medikits => this.gameState.medikits = medikits);
        this.socket.on('updateArmors', armors => this.gameState.armors = armors);
        this.socket.on('gameOver', winner => console.log(`\n🏆 Spiel vorbei! Team ${winner} hat gewonnen!\n`));
    }

    // Warte auf Spielerinitialisierung
    waitForReady() {
        return new Promise((resolve) => {
            if (this.gameState.ready) resolve();
            else {
                const interval = setInterval(() => {
                    if (this.gameState.ready) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    // Teleportiert direkt zu einer Position
    async teleport(x, y) {
        this.move(x - this.gameState.playerX, y - this.gameState.playerY);
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Kreisbewegung für 3 Sekunden
    async moveInCircle() {
        const startTime = Date.now();
        const duration = 3000; // 3 Sekunden
        const radius = 30; // Radius des Kreises
        const speed = 0.005; // Geschwindigkeit der Rotation

        while (Date.now() - startTime < duration) {
            const angle = ((Date.now() - startTime) * speed) % (2 * Math.PI);
            const dx = radius * Math.cos(angle) - radius * Math.cos(angle - speed);
            const dy = radius * Math.sin(angle) - radius * Math.sin(angle - speed);
            this.move(dx, dy);
            await new Promise(resolve => setTimeout(resolve, 1000/30)); // Reduziert auf 30 FPS
        }
    }

    move(dx, dy) {
        if (!this.gameState.connected) {
            console.log('❌ Keine Verbindung zum Server');
            return;
        }
        this.socket.emit('move', { dx, dy });
    }

    shoot(angle) {
        if (!this.gameState.connected) return;
        this.socket.emit('shoot', { angle });
    }

    sendMessage(message) {
        if (!this.gameState.connected) return;
        this.socket.emit('chatMessage', message);
    }

    async runTests() {
        try {
            console.log('\n🧪 Starte Spieltests...\n');

            // 1. Team beitreten und auf Initialisierung warten
            await this.joinTeam('TestBot', 'red');
            await this.waitForReady();
            console.log('🎮 Spiel bereit');

            // 2. Bewegungstest
            console.log('\n🏃 Teste Bewegungen...');
            const movements = [
                { dx: 30, dy: 0 }, { dx: 0, dy: 30 },
                { dx: -30, dy: 0 }, { dx: 0, dy: -30 }
            ];
            
            for (const move of movements) {
                this.move(move.dx, move.dy);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 3. Schießtest
            console.log('\n🔫 Teste Schießen...');
            for (const angle of [0, Math.PI/2, Math.PI, Math.PI*1.5]) {
                this.shoot(angle);
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // 4. Chat
            console.log('\n💬 Teste Chat...');
            this.sendMessage('Hallo, ich bin ein TestBot! 🤖');
            await new Promise(resolve => setTimeout(resolve, 500));

            // 5. Items und Flagge
            console.log('\n🎯 Starte Item-Tests...');
            
            // Medikits
            for (const medikit of this.gameState.medikits) {
                if (!medikit.active) continue;
                await this.teleport(medikit.x, medikit.y);
                console.log('🏥 Medikit aufgesammelt');
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Rüstungen
            for (const armor of this.gameState.armors) {
                if (!armor.active) continue;
                await this.teleport(armor.x, armor.y);
                console.log('🛡️ Rüstung aufgesammelt');
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            // Flaggen-Runs
            console.log('\n🚩 Starte Flaggen-Tests...');
            for (let i = 0; i < 3; i++) {
                // Zur Flagge
                await this.teleport(this.gameState.flag.x, this.gameState.flag.y);
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Zum Spawn
                const spawnX = this.gameState.team === 'red' ? 100 : 1400;
                await this.teleport(spawnX, 400);
                
                // Kreisbewegung für 3 Sekunden
                console.log('🔄 Führe Siegestanz aus...');
                await this.moveInCircle();
                
                console.log(`✅ Flaggen-Run ${i + 1} abgeschlossen`);
            }

            console.log('\n🎉 Tests erfolgreich abgeschlossen!\n');

        } catch (error) {
            console.error('❌ Testfehler:', error);
        }
    }

    joinTeam(username, team) {
        return new Promise((resolve) => {
            if (!this.gameState.connected) {
                console.log('⏳ Warte auf Serververbindung...');
                this.socket.once('connect', () => {
                    this.joinTeam(username, team).then(resolve);
                });
                return;
            }

            console.log(`👤 Team ${team} beitreten als: ${username}`);
            this.gameState.team = team;
            this.socket.emit('chooseTeam', { username, team });
            this.socket.once('state', resolve);
        });
    }

    disconnect() {
        this.socket.disconnect();
        console.log('👋 Verbindung getrennt');
    }
}

// Test ausführen
async function runMockTest() {
    const client = new MockClient();
    await client.runTests();
    
    setTimeout(() => {
        client.disconnect();
    }, 20000);
}

runMockTest(); 