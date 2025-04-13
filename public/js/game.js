import { CANVAS_CONFIG, GAME_CONSTANTS } from './config.js';
import { GameState } from './gameState.js';
import { Renderer } from './renderer.js';
import { EventHandler } from './eventHandlers.js';

class Game {
    constructor() {
        this.socket = io();
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = new GameState();
        this.renderer = new Renderer(this.canvas, this.ctx);
        this.eventHandler = new EventHandler(this.socket, this.gameState);
        
        // Performance-Optimierungen
        this.lastFrameTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.fpsUpdateInterval = 1000;
        this.lastFpsUpdate = 0;
        
        this.setupSocketEvents();
        this.initializeGame();
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Verbunden mit dem Server');
            this.gameState.socketId = this.socket.id;
        });

        this.socket.on('gameState', (state) => {
            this.gameState.updateState(state);
        });

        this.socket.on('playerJoined', (player) => {
            this.gameState.players[player.id] = player;
        });

        this.socket.on('playerLeft', (playerId) => {
            delete this.gameState.players[playerId];
        });

        // Vereinfachte Granaten-Logik
        this.socket.on('updateGrenadePosition', (pos) => {
            this.gameState.updateGrenadePosition(pos);
        });

        this.socket.on('grenadeDropped', (pos) => {
            this.gameState.updateGrenadePosition({ ...pos, isDropped: true });
        });

        this.socket.on('grenadeExplosion', (pos) => {
            this.gameState.handleGrenadeExplosion(pos);
        });
    }

    initializeGame() {
        // Starte die Game-Loop
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    gameLoop(timestamp) {
        // Berechne Delta-Zeit
        const deltaTime = timestamp - this.lastFrameTime;
        this.lastFrameTime = timestamp;

        // Aktualisiere FPS-Zähler
        this.frameCount++;
        if (timestamp - this.lastFpsUpdate >= this.fpsUpdateInterval) {
            this.fps = Math.round((this.frameCount * 1000) / (timestamp - this.lastFpsUpdate));
            this.frameCount = 0;
            this.lastFpsUpdate = timestamp;
            
            // Debug-Ausgabe
            console.log(`FPS: ${this.fps}`);
        }

        // Nur aktualisiere wenn das Spiel läuft
        if (this.gameState.gameRunning) {
            const player = this.gameState.players[this.socket.id];
            if (player) {
                // Bewegungs-Updates nur bei Tastendruck
                if (Object.values(this.gameState.keys).some(pressed => pressed)) {
                    const baseSpeed = player.speedBoostActive ? 6 : 3;
                    const dx = (this.gameState.keys['d'] ? baseSpeed : 0) - (this.gameState.keys['a'] ? baseSpeed : 0);
                    const dy = (this.gameState.keys['s'] ? baseSpeed : 0) - (this.gameState.keys['w'] ? baseSpeed : 0);
                    
                    if (dx !== 0 || dy !== 0) {
                        this.socket.emit('move', { dx, dy });
                    }
                }
            }

            // Rendere nur wenn nötig
            this.renderer.game(this.gameState);
        }

        // Verwende requestAnimationFrame für optimierte Animation
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
}

// Starte das Spiel wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    new Game();
}); 