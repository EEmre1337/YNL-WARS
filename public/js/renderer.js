import { CANVAS_CONFIG } from './config.js';

export class Renderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.terrainPatterns = {
            grass: null,
            dirt: null,
            concrete: null,
            cachedDecorations: []
        };
        this.createTerrainPatterns();
        
        // Performance-Optimierungen
        this.cachedGradients = new Map();
        this.lastFrameTime = 0;
        this.frameInterval = 1000 / 30; // Reduziert auf 30 FPS
        
        // Offscreen Canvas für Hintergrund
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = CANVAS_CONFIG.width;
        this.backgroundCanvas.height = CANVAS_CONFIG.height;
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
        
        // Erstelle Hintergrund einmalig
        this.createBackground();
    }

    clear() {
        this.ctx.clearRect(0, 0, CANVAS_CONFIG.width, CANVAS_CONFIG.height);
    }

    createTerrainPatterns() {
        // Gras-Textur
        const grassCanvas = document.createElement('canvas');
        grassCanvas.width = 40;
        grassCanvas.height = 40;
        const grassCtx = grassCanvas.getContext('2d');
        grassCtx.fillStyle = '#2d5a27';
        grassCtx.fillRect(0, 0, 40, 40);
        
        const grassVariations = [
            { color: '#1e4020', size: 3 },
            { color: '#3a7a33', size: 2 }
        ];
        
        for (let i = 0; i < 20; i++) {
            const variation = grassVariations[i % 2];
            const x = (i * 4) % 40;
            const y = Math.floor(i / 10) * 4;
            grassCtx.fillStyle = variation.color;
            grassCtx.fillRect(x, y, variation.size, variation.size);
        }
        this.terrainPatterns.grass = this.ctx.createPattern(grassCanvas, 'repeat');

        // Weitere Texturen hier...
    }


    game(gameState) {
        const currentTime = performance.now();
        
        // Reduzierte Update-Rate
        if (currentTime - this.lastFrameTime < this.frameInterval) {
            return;
        }
        
        this.lastFrameTime = currentTime;
        
        // Kopiere Hintergrund
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.backgroundCanvas, 0, 0);
        
        // Zeichne nur sichtbare Objekte
        const visibleArea = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // Zeichne Krater (nur sichtbare)
        if (gameState.craters) {
            gameState.craters.forEach(crater => {
                if (this.isInView(crater, visibleArea)) {
                    this.drawCrater(crater.x, crater.y);
                }
            });
        }
        
        // Zeichne Speed-Booster (nur sichtbare)
        if (gameState.speedBoosters) {
            gameState.speedBoosters.forEach(booster => {
                if (booster.active && this.isInView(booster, visibleArea)) {
                    this.drawSpeedBooster(booster.x, booster.y);
                }
            });
        }
        
        // Zeichne Spieler (nur sichtbare)
        Object.values(gameState.players).forEach(player => {
            if (this.isInView(player, visibleArea)) {
                this.drawPlayer(player);
            }
        });
        
        // Zeichne Explosionen (nur sichtbare)
        if (gameState.explosions) {
            gameState.explosions.forEach(explosion => {
                if (this.isInView(explosion, visibleArea)) {
                    this.drawExplosion(explosion.x, explosion.y, explosion.frame);
                }
            });
        }
    }

    createBackground() {
        const gradient = this.backgroundCtx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#000000');
        this.backgroundCtx.fillStyle = gradient;
        this.backgroundCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawCrater(x, y) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(x, y, 20, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fill();
        this.ctx.restore();
    }

    drawPlayer(player) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);

        // Spieler-Körper
        this.ctx.fillStyle = player.team === 'red' ? '#ff4444' : '#4444ff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.fill();

        // Speed-Boost Effekt
        if (player.speedBoostActive) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 25, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawSpeedBooster(x, y) {
        this.ctx.save();
        this.ctx.translate(x, y);

        // Äußerer Gloweffekt
        this.ctx.shadowColor = '#ffff00';
        this.ctx.shadowBlur = 20;

        // Hauptsymbol
        this.ctx.fillStyle = '#ffff00';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -15);
        this.ctx.lineTo(10, 0);
        this.ctx.lineTo(5, 0);
        this.ctx.lineTo(5, 15);
        this.ctx.lineTo(-5, 15);
        this.ctx.lineTo(-5, 0);
        this.ctx.lineTo(-10, 0);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }


    isInView(object, visibleArea) {
        const margin = 50; // Zusätzlicher Rand für Objekte die gerade noch sichtbar sein sollten
        return object.x >= visibleArea.x - margin &&
               object.x <= visibleArea.x + visibleArea.width + margin &&
               object.y >= visibleArea.y - margin &&
               object.y <= visibleArea.y + visibleArea.height + margin;
    }

    // Weitere Render-Methoden hier...
} 