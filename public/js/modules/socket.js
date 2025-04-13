import { updateGameState, updateMedikits, updateArmors } from './gameState.js';

// Socket.io Initialisierung (nutze den global verfügbaren Socket)
export const socket = window.socket;

if (!socket) {
    console.error("❌ Fehler: Socket.io nicht initialisiert!");
}

// Socket Event Handler
socket.on('state', (state) => {
    console.log("📢 Spielstatus empfangen:", state);
    updateGameState(state);
});

socket.on('gameOver', (winner) => {
    alert(`${winner === 'red' ? 'Rotes Team' : 'Blaues Team'} hat gewonnen!`);
    location.reload();
});

socket.on('updateMedikits', updateMedikits);
socket.on('updateArmors', updateArmors);

// Erfolgreiche Team-Auswahl
socket.on('teamJoined', (data) => {
    console.log("✅ Erfolgreich Team beigetreten:", data);
    const teamSelection = document.getElementById('teamSelection');
    const gameCanvas = document.getElementById('gameCanvas');
    
    if (teamSelection && gameCanvas) {
        teamSelection.style.display = 'none';
        gameCanvas.style.display = 'block';
    }
});

// Fehler bei Team-Auswahl
socket.on('teamError', (error) => {
    console.error("❌ Fehler beim Team-Beitritt:", error);
    alert(error.message || "Es gab einen Fehler beim Beitritt zum Team. Bitte versuche es erneut.");
});

// Team Auswahl Funktion
export function chooseTeam(team) {
    console.log("Team-Auswahl aufgerufen für Team:", team);

    const usernameInput = document.getElementById('username');
    if (!usernameInput) {
        console.error("❌ Fehler: Username-Feld existiert nicht!");
        return;
    }

    const username = usernameInput.value.trim();
    if (!username) {
        alert("Bitte gib einen Namen ein!");
        return;
    }

    console.log(`📢 Sende Team-Wahl: { username: "${username}", team: "${team}" }`);
    
    try {
        // Sende Team-Wahl an Server
        socket.emit('chooseTeam', { username, team });
        
        // Direkt UI aktualisieren wie in der alten Version
        const teamSelection = document.getElementById('teamSelection');
        const gameCanvas = document.getElementById('gameCanvas');
        
        if (teamSelection && gameCanvas) {
            teamSelection.style.display = 'none';
            gameCanvas.style.display = 'block';
        } else {
            throw new Error("Team-Auswahl oder Canvas-Element nicht gefunden!");
        }
    } catch (error) {
        console.error("❌ Fehler bei der Team-Auswahl:", error);
        alert("Es gab einen Fehler bei der Team-Auswahl. Bitte versuche es erneut.");
    }
} 