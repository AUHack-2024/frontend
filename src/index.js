const socket = new WebSocket('ws://10.193.85.129:8080');

socket.addEventListener('open', () => {
    console.log('Connected to the WebSocket server');
    socket.send('Hello Server!');
});

socket.addEventListener('message', (event) => {
    console.log('Image from server received');
    // console.log('Image from server received, ', event.data);

    addImage(event.data)
    // socket.send("All done!")
    // const newImageSrc = `data:image/jpg;base64,${event.data}`;
    // mainImage.src = newImageSrc
});

socket.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
});

socket.addEventListener('close', () => {
    console.log('Disconnected from WebSocket server');
});