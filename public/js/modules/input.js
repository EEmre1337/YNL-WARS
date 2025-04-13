import { socket } from './socket.js';
import { keys, mouseX, mouseY, playerX, playerY, canShoot } from '../game.js';

// Tastatureingaben
export function initializeInput(canvas) {
    document.addEventListener('keydown', (e) => {
        if (["w", "a", "s", "d"].includes(e.key)) {
            keys[e.key] = true;
        }

        if (e.key === " " && canShoot) {
            const angle = Math.atan2(mouseY - playerY, mouseX - playerX);

            if (isNaN(angle)) {
                console.error("❌ Fehler: `angle` ist NaN! Mausposition könnte falsch sein.");
                return;
            }

            console.log(`🔫 Schießen mit Winkel: ${angle}`);
            socket.emit('shoot', { angle });

            canShoot = false;
            setTimeout(() => canShoot = true, 500);
        }
    });

    document.addEventListener('keyup', (e) => {
        if (["w", "a", "s", "d"].includes(e.key)) {
            keys[e.key] = false;
        }
    });

    // Mauseingaben
    canvas.addEventListener('mousemove', (event) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = event.clientX - rect.left;
        mouseY = event.clientY - rect.top;
    });

    document.addEventListener('click', () => {
        if (canShoot) {
            const angle = Math.atan2(mouseY - playerY, mouseX - playerX);
            socket.emit('shoot', { angle });
            canShoot = false;
            setTimeout(() => canShoot = true, 500);
        }
    });
}

// Bewegungslogik
export function handleMovement() {
    if (keys['w']) socket.emit('move', { dx: 0, dy: -3 });
    if (keys['a']) socket.emit('move', { dx: -3, dy: 0 });
    if (keys['s']) socket.emit('move', { dx: 0, dy: 3 });
    if (keys['d']) socket.emit('move', { dx: 3, dy: 0 });
}

export const handlers = {
    shoot(socket, gameState) {
        if (gameState.canShoot) {
            const angle = Math.atan2(gameState.mouseY - gameState.playerY, gameState.mouseX - gameState.playerX);
            socket.emit('shoot', { angle });
            gameState.canShoot = false;
            setTimeout(() => gameState.canShoot = true, 500);
        }
    },

    handleMouseMove(event, gameState, canvas) {
        const rect = canvas.getBoundingClientRect();
        gameState.mouseX = event.clientX - rect.left;
        gameState.mouseY = event.clientY - rect.top;
    },

    handleKeyDown(e, gameState, socket, chatInput) {
        if (["w", "a", "s", "d"].includes(e.key)) {
            gameState.keys[e.key] = true;
        } else if (e.key === " ") {
            this.shoot(socket, gameState);
        }
    },

    handleKeyUp(e, gameState) {
        if (["w", "a", "s", "d"].includes(e.key)) {
            gameState.keys[e.key] = false;
        }
    }
};

export const movements = {
    w: { dx: 0, dy: -3 },
    a: { dx: -3, dy: 0 },
    s: { dx: 0, dy: 3 },
    d: { dx: 3, dy: 0 }
}; 