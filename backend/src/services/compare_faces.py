import sys
import os
import json
import base64
import argparse
import cv2
import numpy as np
import face_recognition

def decode_image(image_input: str):
    """
    Decodes an image input which can be a local file path, a URL, or a base64 data URI.
    Returns RGB numpy array image.
    """
    if image_input.startswith("data:image"):
        # Base64 string
        header, encoded = image_input.split(",", 1)
        data = base64.b64decode(encoded)
        nparr = np.frombuffer(data, np.uint8)
        bgr_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if bgr_img is None:
            raise ValueError("Failed to decode base64 image")
        return cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
    
    if os.path.exists(image_input):
        bgr_img = cv2.imread(image_input)
        if bgr_img is None:
            raise ValueError(f"Failed to read image at path: {image_input}")
        return cv2.cvtColor(bgr_img, cv2.COLOR_BGR2RGB)
    
    # Try loading via face_recognition load_image_file
    return face_recognition.load_image_file(image_input)

def get_face_encoding(rgb_img, label="image"):
    """
    Detects face and returns the 128D encoding using OpenCV + face_recognition.
    Tries standard resolution first, then upsamples 2x for distant photos.
    """
    face_locations = face_recognition.face_locations(rgb_img)
    if not face_locations:
        # Upsample detection 2x for small/distant faces in wide office photos
        face_locations = face_recognition.face_locations(rgb_img, number_of_times_to_upsample=2)
    
    if not face_locations:
        return None, f"No face detected in {label}"
    
    encodings = face_recognition.face_encodings(rgb_img, known_face_locations=face_locations)
    if not encodings:
        return None, f"Could not compute encoding for face in {label}"
    
    return encodings[0], None

def compare(ref_path_or_data: str, live_path_or_data: str, tolerance: float = 0.75):
    result = {
        "verified": False,
        "score": 0.0,
        "distance": 1.0,
        "message": "",
        "ref_face_found": False,
        "live_face_found": False
    }
    
    try:
        ref_img = decode_image(ref_path_or_data)
        live_img = decode_image(live_path_or_data)
    except Exception as e:
        result["message"] = f"Image decode error: {str(e)}"
        return result

    ref_encoding, ref_err = get_face_encoding(ref_img, "registered photo")
    if ref_err:
        result["message"] = f"Reference photo error: {ref_err}"
        return result
    result["ref_face_found"] = True

    live_encoding, live_err = get_face_encoding(live_img, "webcam frame")
    if live_err:
        result["message"] = f"Live camera error: {live_err}"
        return result
    result["live_face_found"] = True

    # Compute Euclidean distance using face_recognition
    distances = face_recognition.face_distance([ref_encoding], live_encoding)
    dist = float(distances[0])
    score = max(0.0, float(1.0 - dist))
    
    result["distance"] = round(dist, 4)
    result["score"] = round(score, 4)

    # Tolerant threshold for distant reference vs close live camera
    is_match = dist <= tolerance or score >= 0.25
    result["verified"] = bool(is_match)
    
    conf_pct = int(score * 100)
    if is_match:
        result["message"] = f"Face verified via OpenCV + face_recognition ✓ (confidence: {conf_pct}%)"
    else:
        result["message"] = f"Face mismatch (distance: {dist:.3f}, confidence: {conf_pct}%). Does not match registered candidate."

    return result

def main():
    parser = argparse.ArgumentParser(description="OpenCV + face_recognition compare script")
    parser.add_argument("--ref", required=True, help="Reference candidate image path or base64")
    parser.add_argument("--live", required=True, help="Live camera snapshot base64 or path")
    parser.add_argument("--tolerance", type=float, default=0.75, help="Tolerance threshold (default 0.75)")
    args = parser.parse_args()

    res = compare(args.ref, args.live, args.tolerance)
    print(json.dumps(res))

if __name__ == "__main__":
    main()
