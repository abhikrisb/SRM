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
import pixelmatch from 'https://esm.run/pixelmatch';


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
camera_button1.addEventListener('click', async function () {
    const canvas1 = document.getElementById('canvas1');
    const video1 = document.getElementById('video1');
    const ctx = canvas1.getContext('2d');
    ctx.drawImage(video1, 0, 0, canvas1.width, canvas1.height);

    video1.style.display = "none";
    camera_button1.style.display = "none";
    cameraSelect1.style.display = "none";
    canvas1.style.display = "block";

    // Capture the image data
    const image1 = canvas1.toDataURL('image/jpeg');
    navigator.clipboard.writeText(image1)
        .then(() => console.log('Image data URL copied to clipboard!'))
        .catch(err => console.error('Failed to copy image data URL: ', err));

    // Check for face in the image
    await checkFace(image1);  
    captureCount++;
    if (captureCount >= 1) {
        resetButton.style.display = "block"; // Show the reset button below the canvas
        button3.style.display = "block"; // Show the continue button below the canvas
    }

    // Load reference image
    const referenceImage = document.getElementById('referenceImage');
    
    // Convert captured image to Image object
    const capturedImage = new Image();
    capturedImage.src = image1;
    await new Promise(resolve => capturedImage.onload = resolve);
    
    // Check if image sizes match
    if (referenceImage.width !== capturedImage.width || referenceImage.height !== capturedImage.height) {
        // Resize captured image to match reference image dimensions
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = referenceImage.width;
        tempCanvas.height = referenceImage.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(capturedImage, 0, 0, referenceImage.width, referenceImage.height);
        capturedImage.src = tempCanvas.toDataURL();
        await new Promise(resolve => capturedImage.onload = resolve);
    }
    
    // Create canvases for images
    const referenceCanvas = document.createElement('canvas');
    referenceCanvas.width = referenceImage.width;
    referenceCanvas.height = referenceImage.height;
    const referenceCtx = referenceCanvas.getContext('2d');
    referenceCtx.drawImage(referenceImage, 0, 0);
    
    const capturedCanvas = document.createElement('canvas');
    capturedCanvas.width = capturedImage.width;
    capturedCanvas.height = capturedImage.height;
    const capturedCtx = capturedCanvas.getContext('2d');
    capturedCtx.drawImage(capturedImage, 0, 0);
    
    // Compare images using pixelmatch
    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = referenceImage.width;
    diffCanvas.height = referenceImage.height;
    const diffCtx = diffCanvas.getContext('2d');
    const diff = diffCtx.createImageData(referenceImage.width, referenceImage.height);
    
    const numDiffPixels = pixelmatch(
        referenceCtx.getImageData(0, 0, referenceImage.width, referenceImage.height).data,
        capturedCtx.getImageData(0, 0, capturedImage.width, capturedImage.height).data,
        diff.data,
        referenceImage.width,
        referenceImage.height,
        { threshold: 0.1 }
    );
    
    console.log(`Number of different pixels: ${numDiffPixels}`);
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

function extractTextFromImage(imagePath) {
    Tesseract.recognize(
        imagePath,
        'eng',
        {
            logger: m => console.log(m)
        }
    ).then(({ data: { text } }) => {
        console.log('Extracted Text:', text);
        alert(`Extracted Text: ${text}`);

    }).catch(err => {
        console.error('Error:', err);
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

async function checkFace(image) {
    try {
        const response = await fetch('http://localhost:5000/checkFace', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: image  // Image to check for face
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Unknown error occurred');
        }

        const data = await response.json();
        console.log('Response:', data.result);
        if (data.face_detected) {
            alert('Face detected in the image!');
        } else {
            alert('No face detected in the image.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    }
}



// Add event listener for the submit button
button4.addEventListener('click', submitImages);