let camera_button1 = document.querySelector("#button1"); //first capture button
let video1 = document.querySelector("#video1"); //first video element
let button3 = document.querySelector("#button3"); //first continue button
let canvas1 = document.querySelector("#canvas1"); //first canvas element
let resetButton = document.querySelector("#reset1"); //first reset button
let tablecontent1 = document.querySelector("#idcard");
let tablecontent2 = document.querySelector("#face");
let captureCount = 0; //count for the first camera
let image1; // Store 1st Image (IDCard)
let tab1 = document.querySelector(".tab1"); // header1

let camera_button2 = document.querySelector("#button2"); //second capture button
let video2 = document.querySelector("#video2"); //second video element
let button4 = document.querySelector("#button4"); //second continue button
let canvas2 = document.querySelector("#canvas2"); //second canvas element
let resetButton2 = document.querySelector("#reset2"); //second reset button
let captureCount2 = 0; //count for the second camera
let image2; // Store 2nd Image (Face Check)
let tab2 = document.querySelector(".tab2"); // header2

let cameraSelect1 = document.querySelector("#cameraSelect1"); //dropdown for the first camera
let cameraSelect2 = document.querySelector("#cameraSelect2"); //dropdown for the second camera
let image1FaceData; // Store face data for the first image

document.addEventListener("DOMContentLoaded", async () => {
    // Ensure the page is loaded over HTTPS credits:StackOverflow (30 mins of research)
    if (location.protocol !== 'https:') {
        location.replace(`https:${location.href.substring(location.protocol.length)}`);
    }

    // Check for mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        alert('Your browser does not support media devices.');
        return;
    }

    // Start the camera
    tab1.style.display = "none";
    tab1.style.display = "block";
    tab2.style.display = "none";
    await updateCameraList(cameraSelect1, video1); 
    await updateCameraList(cameraSelect2, video2); 
    await startCamera(video1, 'user'); 
});

async function updateCameraList(selectElement, videoElement) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');

    selectElement.innerHTML = '';

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        // Fallback for mobile devices
        const frontOption = document.createElement('option');
        frontOption.value = 'user';
        frontOption.text = 'Front Camera';
        selectElement.appendChild(frontOption);

        const backOption = document.createElement('option');
        backOption.value = 'environment';
        backOption.text = 'Back Camera';
        selectElement.appendChild(backOption);
    } else {
        // Populate options for PCs
        videoDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Camera ${selectElement.length + 1}`;
            selectElement.appendChild(option);
        });
    }

    selectElement.addEventListener('change', async () => {
        await startCamera(videoElement, selectElement.value);
    });
}

async function startCamera(videoElement, facingModeOrDeviceId) {
    const constraints = {
        video: {
            facingMode: /user|environment/.test(facingModeOrDeviceId) ? facingModeOrDeviceId : undefined,
            deviceId: !/user|environment/.test(facingModeOrDeviceId) ? { exact: facingModeOrDeviceId } : undefined
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = stream;
    } catch (error) {
        console.error('Error accessing media devices.', error);
        alert('Error accessing media devices: ' + error.message);
    }
}


import config from './config.js';

// Use the API keys from the config
const faceApiKey = config.faceApiKey;
const faceApiEndpoint = config.faceApiEndpoint;
const visionApiKey = config.visionApiKey;


// Function to detect faces using Azure Face API
async function detectFaces(imageUrl) {
    // Fetch the image as binary data
    const response = await fetch(imageUrl);
    const imageData = await response.arrayBuffer();

    const requestBody = new Uint8Array(imageData);

    const apiResponse = await fetch(`${faceApiEndpoint}/face/v1.0/detect`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Ocp-Apim-Subscription-Key': faceApiKey
        },
        body: requestBody
    });

    const data = await apiResponse.json();
    console.log('Face API Response:', data); // Log the entire response
    return data;
}

// Function to draw rectangles around detected faces
function drawFaces(ctx, faces) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    faces.forEach(face => {
        const { left, top, width, height } = face.faceRectangle;
        ctx.strokeRect(left, top, width, height);
    });
}


camera_button1.addEventListener('click', async function () {
    try {
        const ctx = canvas1.getContext('2d');
        ctx.drawImage(video1, 0, 0, canvas1.width, canvas1.height);
        video1.style.display = "none";
        camera_button1.style.display = "none";
        canvas1.style.display = "block"; // Show the canvas
        resetButton.style.display = "block";
        button3.style.display = "block";
        cameraSelect1.style.display = "none";
        // Capture the image from the canvas
        let capturedImage = canvas1.toDataURL('image/png');

        // Extract text from the ID card image
        let extractedText = await extractTextFromImage(capturedImage);
        console.log('Extracted Text:', extractedText);
        // Detect faces in the captured image
        let faceData = await detectFaces(capturedImage);
        console.log('Detected Face Data:', faceData);
        drawFaces(ctx, faceData);
        // Store the face data for future use
        image1FaceData = faceData;

    } catch (error) {
        console.error("An error occurred during image processing:", error);
    }
});

// Event listener for the second capture button
camera_button2.addEventListener('click', async function () {
    const ctx = canvas2.getContext('2d');
    ctx.drawImage(video2, 0, 0, canvas2.width, canvas2.height);
    video2.style.display = "none";
    camera_button2.style.display = "none";
    cameraSelect2.style.display = "none";
    canvas2.style.display = "block"; // Show the canvas
    image2 = canvas2.toDataURL('image/jpeg');
    navigator.clipboard.writeText(image2)
        .then(() => console.log('Image data URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy image data URL: ', err));

    captureCount2++;
    if (captureCount2 >= 1) {
        resetButton2.style.display = "block"; // Make the reset button visible
        button4.style.display = "block"; // Make the continue button visible
    }
});

resetButton.addEventListener('click', () => {
  camera_button1.style.display = "block";
  video1.style.display = "block";
  cameraSelect1.style.display = "block";
  resetButton.style.display = "none"; // Hide the reset button
  button3.style.display = "none"; // Hide the continue button
  canvas1.style.display = "none"; // Hide the canvas

  // Reset the display property of the video and button to ensure alignment
  video1.style.display = "block";
  camera_button1.style.display = "block";
  
  startCamera(video1); // Restart the camera
});

resetButton2.addEventListener('click', () => {
    camera_button2.style.display = "block";
    video2.style.display = "block";
    cameraSelect2.style.display = "block";
    resetButton2.style.display = "none"; // Hide the reset button
    button4.style.display = "none"; // Hide the continue button
    canvas2.style.display = "none"; // Hide the canvas
    startCamera(video2);
});

async function extractTextFromImage(imageUrl) {
    // Send the image to Cloud Vision API
    fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            requests: [
                {
                    image: {
                        content: imageUrl.split(',')[1]
                    },
                    features: [
                        {
                            type: 'TEXT_DETECTION'
                        }
                    ]
                }
            ]
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('API Response:', data); // Log the entire response
        if (data.responses && data.responses[0] && data.responses[0].fullTextAnnotation) {
            const detectedText = data.responses[0].fullTextAnnotation.text;
            console.log('Detected Text:', detectedText);
            return detectedText;
        } else {
            console.error("No text detected or unexpected response format", data);
        }
    })
    .catch(err => {
        console.error("Error with Cloud Vision API: ", err);
    });
}

button3.addEventListener('click', () => {
    tab1.style.display = "none";
    tab2.style.display = "block";
    startCamera(video2);
    cameraSelect2.style.display = "block";
    tablecontent1.style.display = "none"; // hide the first tab
    video2.style.display = "block"; //show the second video
    tablecontent2.style.display = "block";
    extractTextFromImage(image1);
});

cameraSelect1.addEventListener('change', () => {
    startCamera(video1);
});

cameraSelect2.addEventListener('change', () => {
    startCamera(video2);
});

async function submitImages() {
    const response = await fetch('http://localhost:5000/compare', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            image1: image1,  // ID card image
            image2: image2   // Face image
        }),
    });

    const data = await response.json();
    if (data.match) {
        if (data.similarity !== undefined) {
            alert(`Faces match with a similarity of ${data.similarity}%!`);
        } else {
            alert('Faces match but similarity score is not available.');
        }
    } else {
        if (data.similarity !== undefined) {
            alert(`Faces do not match. Similarity: ${data.similarity}%`);
        } else {
            alert('Faces do not match and similarity score is not available.');
        }
    }
}

// Add event listener for the submit button
button4.addEventListener('click', submitImages);

(function() {
    function detectDevTools() {
        const threshold = 160;
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        if (widthThreshold || heightThreshold) {
            window.location.href = 'https://i.giphy.com/Te2hTzFEdFaLn8L6oL.gif'; // Redirect URL
        }
    }

    setInterval(detectDevTools, 1000); // Check every second
})();