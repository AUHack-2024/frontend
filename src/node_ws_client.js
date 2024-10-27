import WebSocket from 'ws'
const socket = new WebSocket('ws://10.193.85.129:8080');

socket.onmessage = function(event) {
    console.log('Received:', event.data);
};

socket.onopen = function() {
    console.log('WebSocket connection established.');
};

socket.onclose = function() {
    console.log('WebSocket connection closed.');
};