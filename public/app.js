
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (username) {
        setupPersistentConnection(username);
    }
});


function setupPersistentConnection(username) {
    let ws;
    let reconnectInterval;

    function connectToTwitch() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        ws = new WebSocket(`wss://${location.host}/ws?streamer=${username}`);

        ws.onopen = ws.onmessage = ws.onerror = function(event) {
            if (event.type === 'message') {
                const data = JSON.parse(event.data);
                if (data.audioUrl) {
                    playAudio(data.audioUrl);
                    console.log('Received audio:', data.audioUrl);
                }
            } else if (event.type === 'error') {
                console.error('WebSocket error:', event);
            }
        };
    }

    function manageConnection(visibility) {
        if (visibility) {
            connectToTwitch();
            if (!reconnectInterval) reconnectInterval = setInterval(connectToTwitch, 10000);
        } else {
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
        }
    }

    if (window.obsstudio) {
        window.obsstudio.onVisibilityChange = function(visibility) {
            manageConnection(visibility);
        };
    }

    manageConnection(true); // Assume initial visibility is true for first setup
}

function playAudio(audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(error => console.error('Error playing audio:', error));
}
