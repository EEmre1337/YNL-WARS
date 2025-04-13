// Spielzustandsvariablen
export const state = {
    players: {},
    projectiles: [],
    walls: [],
    flag: {},
    score: { red: 0, blue: 0 },
    redSpawn: {},
    blueSpawn: {},
    gameRunning: false,
    medikits: [],
    armors: [],
    mouseX: 0,
    mouseY: 0,
    playerX: 0,
    playerY: 0,
    canShoot: true
};

export const keys = {};

// Aktualisiert den Spielzustand
export function updateGameState(newState) {
    Object.assign(state, newState);
    if (!state.gameRunning) {
        state.gameRunning = true;
    }
}

// Aktualisiert die Medikits
export function updateMedikits(serverMedikits) {
    state.medikits = serverMedikits;
}

// Aktualisiert die Rüstungen
export function updateArmors(serverArmors) {
    state.armors = serverArmors;
} 