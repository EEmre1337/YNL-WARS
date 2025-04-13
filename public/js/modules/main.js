import { initializeKeyboardControls, initializeMouseControls, handleMovement } from './input.js';
import { render } from './render.js';
import { initializeChat } from './chat.js';
import { state } from './gameState.js';

// Canvas Initialisierung
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Spiel-Initialisierung
export function initializeGame() {
    console.log("🎮 Spiel wird initialisiert...");

    if (!canvas || !ctx) {
        console.error("❌ Fehler: Canvas oder Context nicht gefunden!");
        return;
    }

    // Input-Handler initialisieren
    initializeKeyboardControls();
    initializeMouseControls(canvas);

    // Chat initialisieren
    initializeChat();

    console.log("✅ Spiel erfolgreich initialisiert!");

    // Spielschleife starten
    gameLoop();
}

// Hauptspiel-Loop
function gameLoop() {
    if (!state.gameRunning) {
        console.log("⏳ Warte auf Spielstart...");
        requestAnimationFrame(gameLoop);
        return;
    }

    handleMovement();
    render(ctx);
    requestAnimationFrame(gameLoop);
} 