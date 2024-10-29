let socket;
let connectionInterval;
const interval = 3000;
const server = "10.193.85.129:8080"

function connectWebSocket() {
    socket = new WebSocket(`ws://${server}`);

    socket.onopen = function() {
        console.log('WebSocket connection established.');
        clearInterval(connectionInterval);
    };

    socket.onmessage = function(event) {
        console.log('Received:', event.data);
    };

    socket.onclose = function() {
        console.log('WebSocket connection closed.');
    };

    socket.onerror = function(error) {
        console.log('WebSocket error:', error.message);
    };
}

// Try to connect every 3 seconds until successful
connectionInterval = setInterval(connectWebSocket, interval);