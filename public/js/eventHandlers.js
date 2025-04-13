import { GAME_CONSTANTS } from './config.js';

export class EventHandler {
    constructor(socket, gameState) {
        this.socket = socket;
        this.gameState = gameState;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Tastatur-Events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Maus-Events
        document.addEventListener('mousemove', this.move.bind(this));
        document.addEventListener('click', this.handleClick.bind(this));
        
        // Speed-Booster Event
        this.socket.on('speedBoostActive', (duration) => {
            const player = this.gameState.players[this.gameState.socketId];
            if (player) {
                player.speedBoostActive = true;
                player.speedBoostEndTime = performance.now() + duration;
            }
        });
    }

    handleClick(event) {
        // Leer lassen, da wir keine Click-Events mehr für Granaten brauchen
    }

    move(event) {
        const rect = event.target.getBoundingClientRect();
        this.gameState.mouseX = event.clientX - rect.left;
        this.gameState.mouseY = event.clientY - rect.top;
    }

    handleKeyDown(e) {
        if (["w", "a", "s", "d"].includes(e.key)) {
            this.gameState.keys[e.key] = true;
        } else if (e.key === " ") {
            this.shoot();
        }
    }

    handleKeyUp(e) {
        if (["w", "a", "s", "d"].includes(e.key)) {
            this.gameState.keys[e.key] = false;
        }
    }
} 