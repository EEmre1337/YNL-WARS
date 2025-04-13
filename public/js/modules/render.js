import { state } from './gameState.js';

export function render(ctx) {
    const { players, projectiles, walls, flag, score, redSpawn, blueSpawn, medikits, armors } = state;
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Spawnzonen
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    ctx.fillRect(redSpawn.x - 50, redSpawn.y - 50, 100, 100);
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.fillRect(blueSpawn.x - 50, blueSpawn.y - 50, 100, 100);

    // Wände
    ctx.fillStyle = 'grey';
    walls.forEach(wall => ctx.fillRect(wall.x, wall.y, wall.width, wall.height));

    // Spieler
    for (const id in players) {
        const player = players[id];

        // Spieler-Kreis
        ctx.fillStyle = player.team === 'red' ? 'red' : 'blue';
        ctx.beginPath();
        ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
        ctx.fill();

        // Flagge am Spieler
        if (player.hasFlag) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(player.x - 5, player.y - 20, 10, 10);
        }

        // Leben und Rüstung
        const heartX = player.x - 10;
        const heartY = player.y + 15;
        
        ctx.fillStyle = "red";
        for (let i = 0; i < player.health; i++) {
            ctx.fillRect(heartX + i * 12, heartY, 10, 10);
        }
        
        const armorX = heartX + (player.health * 12);
        ctx.fillStyle = "blue";
        for (let i = 0; i < player.armor; i++) {
            ctx.fillRect(armorX + i * 12, heartY, 10, 10);
        }

        // Spielername
        if (player.username) {
            ctx.fillStyle = "black";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.fillText(player.username, player.x, player.y - 15);
        }
    }

    // Projektile
    ctx.fillStyle = 'black';
    projectiles.forEach(proj => {
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    // Flagge
    if (!flag.holder) {
        ctx.fillStyle = 'yellow';
        ctx.fillRect(flag.x - 10, flag.y - 10, 20, 20);
    }

    // Medikits
    ctx.fillStyle = 'green';
    medikits.forEach(medikit => {
        if (medikit.active) {
            ctx.fillRect(medikit.x - 5, medikit.y - 5, 10, 10);
        }
    });

    // Rüstungen
    ctx.fillStyle = 'brown';
    armors.forEach(armor => {
        if (armor.active) {
            ctx.fillRect(armor.x - 5, armor.y - 5, 10, 10);
        }
    });

    // Punktestand
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Rot: ${score.red} | Blau: ${score.blue}`, 700, 20);
}

export const renderFunctions = {
    spawnZones(ctx, gameState) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(gameState.redSpawn.x - 50, gameState.redSpawn.y - 50, 100, 100);
        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fillRect(gameState.blueSpawn.x - 50, gameState.blueSpawn.y - 50, 100, 100);
    },

    walls(ctx, gameState) {
        ctx.fillStyle = 'grey';
        gameState.walls.forEach(wall => ctx.fillRect(wall.x, wall.y, wall.width, wall.height));
    },

    players(ctx, gameState) {
        for (const id in gameState.players) {
            const player = gameState.players[id];
            
            // Spieler-Kreis
            ctx.fillStyle = player.team === 'red' ? 'red' : 'blue';
            ctx.beginPath();
            ctx.arc(player.x, player.y, 10, 0, Math.PI * 2);
            ctx.fill();

            // Flagge am Spieler
            if (player.hasFlag) {
                ctx.fillStyle = 'yellow';
                ctx.fillRect(player.x - 5, player.y - 20, 10, 10);
            }

            // Status-Anzeigen
            const heartX = player.x - 10;
            const heartY = player.y + 15;
            
            // Leben und Rüstung
            ctx.fillStyle = "red";
            for (let i = 0; i < player.health; i++) {
                ctx.fillRect(heartX + i * 12, heartY, 10, 10);
            }
            
            ctx.fillStyle = "blue";
            for (let i = 0; i < player.armor; i++) {
                ctx.fillRect(heartX + (player.health * 12) + i * 12, heartY, 10, 10);
            }

            // Spielername
            if (player.username) {
                ctx.fillStyle = "black";
                ctx.font = "14px Arial";
                ctx.textAlign = "center";
                ctx.fillText(player.username, player.x, player.y - 15);
            }
        }
    },

    projectiles(ctx, gameState) {
        ctx.fillStyle = 'black';
        gameState.projectiles.forEach(proj => {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    items(ctx, gameState) {
        if (!gameState.flag.holder) {
            ctx.fillStyle = 'yellow';
            ctx.fillRect(gameState.flag.x - 10, gameState.flag.y - 10, 20, 20);
        }

        ctx.fillStyle = 'green';
        gameState.medikits.forEach(item => {
            if (item.active) ctx.fillRect(item.x - 5, item.y - 5, 10, 10);
        });

        ctx.fillStyle = 'brown';
        gameState.armors.forEach(item => {
            if (item.active) ctx.fillRect(item.x - 5, item.y - 5, 10, 10);
        });
    },

    score(ctx, gameState) {
        ctx.fillStyle = 'black';
        ctx.font = '24px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`Rot: ${gameState.score.red} | Blau: ${gameState.score.blue}`, ctx.canvas.width - 20, 30);
    }
}; 