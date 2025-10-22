
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
    let pingInterval;

    function connectToTwitch() {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${protocol}//${location.host}/ws?streamer=${username}`);

        ws.onopen = function() {
            startPing();
        };

        ws.onmessage = function(event) {
            if (event.data === 'pong') return;
            const data = JSON.parse(event.data);
            if (data.audioUrl) {
                playAudio(data.audioUrl);
                console.log('Received audio:', data.audioUrl);
            }
        };

        ws.onerror = function(event) {
            console.error('WebSocket error:', event);
        };

        ws.onclose = function() {
            console.log('WebSocket closed. Reconnecting...');
            stopPing();
            ws = null;
            setTimeout(connectToTwitch, 1000);
        };
    }

    function startPing() {
        if (!pingInterval) {
            pingInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, 30000);
        }
    }

    function stopPing() {
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
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
            stopPing();
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
