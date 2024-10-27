// import { createGif } from './gif-gen.js';

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
    // renderMainGif(counter, parsedData.best)
    if(imageList.length >= 2) renderMainImage(imageList.pop())
}

function renderMainGif(counter, n){
    console.log(dictionary)
    const gifArray = dictionary[counter-1].slice((n*10-10), (n*10))
    // const base64Images = []
    // gifArray.forEach(element => {
    //     base64Images.push(element.image)
    // });
    // createGif(base64Images).then(gifDataUrl => {
    //     console.log('Generated GIF Data URL:', gifDataUrl);
    //     // You can use the gifDataUrl to display the GIF in an <img> element
    //     const img = document.createElement('img');
    //     img.src = gifDataUrl;
    //     document.body.appendChild(img);
    // });
    const gif = new GIF({
        workers: 2,    
        quality: 5,   // Quality of the GIF (lower means better quality)
        workerScript: './gif.worker.js', // Path to the gif.worker.js file
    });
    gifArray.forEach((base64) => {
        base64ToImage(base64.image, (img) => {
            gif.addFrame(img, { delay: 170 }); 
        })
    })
    gif.on('finished', (blob) => {
        const gifUrl = URL.createObjectURL(blob);
        console.log('GIF created:', gifUrl);
    
        renderMainImage(gifUrl)
    });
}

function base64ToImage(base64String, callback) {
    const img = new Image();
    img.src = `data:image/jpg;base64,${base64String}`;
    img.onload = () => callback(img);
    img.onerror = (error) => console.error('Error loading image:', error);
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
}|

function renderMainImage(image){
    mainImage.src = `data:image/jpg;base64,${image.image}`
    // mainImageValue.innerHTML = `${image.score}`
}