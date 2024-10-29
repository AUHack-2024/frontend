const dictionary = {};
let imageList = [];
const historyView = document.getElementById("history-view")
const mainImage = document.getElementById("main-image");
const mainImageValue = document.getElementById("main-image-value");
let counter = 0

function addImage(data) {
    let currentVideoArray = []
    console.log(data, " JSON")
    const parsedData = JSON.parse(data)
    console.log(parsedData, " JSON")
    parsedData.video.forEach(tuple => {
        const image = tuple.image;
        console.log(image)
        const score = parseFloat(tuple.score)
        console.log(score)
        currentVideoArray.push({score, image})
    })
    dictionary[counter] = currentVideoArray
    counter++;
    console.log(counter, "  counter")

    imageList = [...imageList, ...currentVideoArray]
    imageList.sort((a, b) => a.score - b.score)
    console.log(currentVideoArray, " currentVideoArray ", imageList, " imageList")
    currentVideoArray = [];
    renderImageList();
    renderMainGif(counter, parsedData.best)
    // if(imageList.length >= 2) renderMainImage(imageList.pop())
}

function renderMainGif(counter, n){
    console.log(dictionary)
    const gifArray = dictionary[counter-1].slice((n*10-10), (n*10))
    const base64Images = []
    gifArray.forEach(element => {
        base64Images.push(element.image)
    });
    createVideo(base64Images)
}

function base64ToImage(base64String, callback) {
    const img = new Image();
    img.src = `data:image/jpg;base64,${base64String}`;
    img.onload = () => callback(img);
    img.onerror = (error) => console.error('Error loading image:', error);
}

const videoElement = document.getElementById('video');
const frameDuration = 500;
async function createVideo(base64Images) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Create a video element and set its width/height based on the first image
    const img = new Image();
    img.src = `data:image/jpg;base64,${base64Images[0]}`;

    await new Promise((resolve) => {
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            resolve();
        };
    });

    const stream = canvas.captureStream(25); // 25 fps
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];

    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(blob);
        videoElement.src = videoUrl;
    };

    mediaRecorder.start();

    for (const base64Image of base64Images) {
        img.src = `data:image/jpg;base64,${base64Image}`;
        await new Promise((resolve) => {
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                setTimeout(resolve, frameDuration);
            };
        });
    }

    mediaRecorder.stop();
}

// /O(logn)
function findInsertPosition(value) {
    let low = 0;
    let high = imageList.length;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (imageList[mid].value < value) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    return low;
}

function renderImageList() {
    historyView.innerHTML = ''; // Clear existing images
    console.log(imageList, "imageList") 
    imageList.forEach(item => {
        console.log(item.image, "LOG") 
        const historyElement = document.createElement("div");
        historyElement.className = 'history-element';
        historyElement.innerHTML = `
            <img src="data:image/jpg;base64,${item.image}" alt="Image" />
            <span>${item.score}</span>
        `;

        historyView.appendChild(historyElement);
    });
}

function renderMainImage(image){
    mainImage.src = `data:image/jpg;base64,${image.image}`
    // mainImageValue.innerHTML = `${image.score}`
}