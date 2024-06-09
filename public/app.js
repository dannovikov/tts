
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const username = urlParams.get('username');
    if (username) {
        console.log('Streamer username:', username);
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

        ws = new WebSocket(`ws://${location.host}/ws?streamer=${username}`);

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
            console.log('Connecting to Twitch...');
            connectToTwitch();
            if (!reconnectInterval) reconnectInterval = setInterval(connectToTwitch, 10000);
        } else {
            console.log('Disconnecting from Twitch...');
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
                reconnectInterval = null;
            }
            if (ws) {
                ws.close();
                ws = null;
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
