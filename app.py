import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import cv2
import numpy as np
from deepface import DeepFace
from retinaface import RetinaFace

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def decode_image(image_data):
    image_data = image_data.split(",")[1]
    image_bytes = base64.b64decode(image_data)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    return img

@app.route('/compare', methods=['POST'])
def compare_faces():
    data = request.json
    image1 = decode_image(data['image1'])
    image2 = decode_image(data['image2'])

    try:
        # Convert images to RGB
        result = DeepFace.verify(img1_path = image1, img2_path = image2,model_name = "Facenet", distance_metric = "cosine")

        # Return JSON response with match result and similarity
        return jsonify({
            'match': result['verified'],
            'similarity': 1 - result['distance']  # Similarity is 1 - distance
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def decodeimage(image_data):
    try:
        # Log the received image data for debugging
        print(f"Received image data: {image_data[:50]}...")  # Log the first 50 characters

        # Check if the image_data contains a comma
        if "," not in image_data:
            raise ValueError("Invalid image data format")

        # Split the base64 string to get the actual image data
        image_data = image_data.split(",")[1]
        # Decode the base64 string
        image_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"Error decoding image: {str(e)}")
        raise ValueError(f"Failed to decode image: {e}")

@app.route('/checkFace', methods=['POST'])
def checkFace():
    try:
        data = request.json
        image = decodeimage(data['image'])

        # Convert image to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        # Analyze face using DeepFace with Facenet model
        result = DeepFace.analyze(image_rgb, actions=['age', 'gender', 'race', 'emotion'], enforce_detection=False)
        
        if not result:
            return jsonify({'face_detected': False}), 200
        else:
            return jsonify({'face_detected': True, 'result': result}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    from waitress import serve
    serve(app, host='0.0.0.0', port=5000)