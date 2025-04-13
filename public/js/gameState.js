import { CANVAS_CONFIG } from './config.js';

export class GameState {
    constructor() {
        this.players = {};
        this.projectiles = [];
        this.walls = [];
        this.flag = {};
        this.score = { red: 0, blue: 0 };
        this.redSpawn = {};
        this.blueSpawn = {};
        this.medikits = [];
        this.armors = [];
        this.speedBoosters = [];
        this.speedBoostActive = false;
        this.speedBoostEndTime = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.playerX = 0;
        this.playerY = 0;
        this.canShoot = true;
        this.gameRunning = false;
        this.keys = {};
        this.selectedClass = 'classic';
        this.staticDecorations = {
            tireTrackPositions: [],
            craterPositions: [],
        };
        this.craters = [];
        
        // Performance-Optimierungen
        this.lastUpdate = 0;
        this.updateInterval = 1000 / 30; // Reduziert auf 30 FPS
        this.maxCraters = 20; // Reduzierte maximale Anzahl von Kratern
    }

    initializeStaticDecorations() {
        // Reifenspuren
        for (let i = 0; i < 5; i++) {
            this.staticDecorations.tireTrackPositions.push({
                x: Math.random() * CANVAS_CONFIG.width,
                y: Math.random() * CANVAS_CONFIG.height
            });
        }

        // Granatkrater
        for (let i = 0; i < 8; i++) {
            this.staticDecorations.craterPositions.push({
                x: Math.random() * CANVAS_CONFIG.width,
                y: Math.random() * CANVAS_CONFIG.height
            });
        }

        // Munitionskisten
        this.staticDecorations.ammoCratePositions = [
            { x: CANVAS_CONFIG.width * 0.25, y: CANVAS_CONFIG.height * 0.25 },
            { x: CANVAS_CONFIG.width * 0.75, y: CANVAS_CONFIG.height * 0.75 },
            { x: CANVAS_CONFIG.width * 0.5, y: CANVAS_CONFIG.height * 0.5 }
        ];
    }

    updateState(state) {
        const currentTime = performance.now();
        
        // Aktualisiere nur wenn genug Zeit vergangen ist
        if (currentTime - this.lastUpdate < this.updateInterval) {
            return;
        }
        
        this.lastUpdate = currentTime;
        
        // Aktualisiere nur geänderte Werte
        if (state.players) {
            // Behalte nur aktive Spieler
            this.players = Object.fromEntries(
                Object.entries(state.players).filter(([_, player]) => player.active)
            );
        }
        
        
        if (state.craters) {
            // Begrenze die Anzahl von Kratern
            this.craters = state.craters.slice(-this.maxCraters);
        }
        
        if (state.speedBoosters) {
            // Behalte nur aktive Speed-Booster
            this.speedBoosters = state.speedBoosters.filter(booster => booster.active);
        }

        // Überprüfe ob der Speed-Boost abgelaufen ist
        const player = this.players[this.socketId];
        if (player && player.speedBoostActive && currentTime >= player.speedBoostEndTime) {
            player.speedBoostActive = false;
        }
    }

    hasPlayerChanged(oldPlayer, newPlayer) {
        return oldPlayer.x !== newPlayer.x ||
               oldPlayer.y !== newPlayer.y ||
               oldPlayer.health !== newPlayer.health ||
               oldPlayer.armor !== newPlayer.armor ||
               oldPlayer.hasFlag !== newPlayer.hasFlag ||
               oldPlayer.speedBoostActive !== newPlayer.speedBoostActive;
    }

    addCrater(x, y) {
        // Entferne alte Krater wenn zu viele vorhanden sind
        if (this.craters.length >= this.maxCraters) {
            this.craters.shift();
        }
        
        this.craters.push({ x, y });
    }

    activateSpeedBoost(duration) {
        this.speedBoostActive = true;
        this.speedBoostEndTime = performance.now() + duration;
        if (this.players[this.socketId]) {
            this.players[this.socketId].speedBoostActive = true;
        }
    }
} 