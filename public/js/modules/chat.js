import { socket } from './socket.js';

export function initializeChat() {
    const chatInput = document.getElementById('chatInput');
    const chatMessagesContainer = document.getElementById('chatMessages');
    const chatForm = document.getElementById('chatForm');

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const message = chatInput.value.trim();
        if (message) {
            console.log("📤 Nachricht senden:", message);
            socket.emit('chatMessage', message);
            chatInput.value = '';
        }
    });

    // Chat-Nachrichten vom Server empfangen
    socket.on('chatUpdate', (messages) => {
        console.log("📥 Chat-Nachrichten empfangen:", messages);
        chatMessagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const li = document.createElement('li');
            li.textContent = msg;
            chatMessagesContainer.appendChild(li);
        });
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
} 