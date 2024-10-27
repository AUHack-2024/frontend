export function createGif(base64Images, delay = 100) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create an array to hold the images
    const images = [];
    
    // Load each base64 image
    const loadImages = () => {
        return Promise.all(base64Images.map(base64 => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    resolve(img);
                };
                img.src = base64;
            });
        }));
    };

    // Generate the GIF from loaded images
    const generateGif = (loadedImages) => {
        // Set canvas dimensions based on the first image
        canvas.width = loadedImages[0].width;
        canvas.height = loadedImages[0].height;
        
        // Create an array to hold the frames
        const frames = [];
        
        loadedImages.forEach((img, index) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            frames.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        });

        return createGifFromFrames(frames, delay);
    };

    // A simple method to convert frames into a GIF-like format (not actual GIF encoding)
    const createGifFromFrames = (frames, delay) => {
        // NOTE: This is a placeholder; you need a proper GIF encoder implementation.
        // For simplicity, we will just return a data URL of the last frame
        ctx.putImageData(frames[frames.length - 1], 0, 0);
        return canvas.toDataURL('image/gif');
    };

    // Load images and generate GIF
    return loadImages().then(generateGif);
}
