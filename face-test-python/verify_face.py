import sys
import argparse
import face_recognition
import cv2


def load_known_face(image_path: str):
    """Load a reference photo and return the first detected face encoding."""
    print(f"[INFO] Loading known face from: {image_path}")
    known_image = face_recognition.load_image_file(image_path)
    
    # Try standard face locations first
    face_locations = face_recognition.face_locations(known_image)
    
    # If no face found in large/distant photo, try upsampling
    if not face_locations:
        print("[INFO] No face found with default resolution. Attempting upsampled detection...")
        face_locations = face_recognition.face_locations(known_image, number_of_times_to_upsample=2)
    
    if not face_locations:
        print(f"[ERROR] No face found in {image_path}. Use a clear, front-facing photo.")
        sys.exit(1)

    print(f"[INFO] Found {len(face_locations)} face(s) in reference photo.")
    known_encodings = face_recognition.face_encodings(known_image, known_face_locations=face_locations)

    if not known_encodings:
        print(f"[ERROR] Could not compute face encodings for {image_path}.")
        sys.exit(1)

    return known_encodings[0]


def main():
    parser = argparse.ArgumentParser(
        description="Live face verification against a single known photo."
    )
    parser.add_argument(
        "--known",
        default="student.jpg",
        help="Path to the known/reference face image (default: student.jpg)",
    )
    parser.add_argument(
        "--tolerance",
        type=float,
        default=0.65,
        help="Face comparison tolerance; lower is stricter (default: 0.65 = lenient)",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=0,
        help="Webcam index, usually 0 for the default camera",
    )
    args = parser.parse_args()

    known_encoding = load_known_face(args.known)

    video = cv2.VideoCapture(args.camera)
    if not video.isOpened():
        print(f"[ERROR] Could not open camera index {args.camera}")
        sys.exit(1)

    print("[INFO] Webcam started. Press ESC to exit.")
    last_status = None  # avoid spamming the console every frame

    while True:
        ret, frame = video.read()
        if not ret:
            print("[ERROR] Failed to read frame from webcam.")
            break

        # Resize for faster detection, then convert BGR -> RGB (contiguous array)
        small_frame = cv2.resize(frame, (0, 0), fx=0.5, fy=0.5)
        rgb_small = cv2.cvtColor(small_frame, cv2.COLOR_BGR2RGB)

        face_locations = face_recognition.face_locations(rgb_small)
        face_encodings = face_recognition.face_encodings(rgb_small, face_locations)

        status = "no_face"

        for (top, right, bottom, left), face_encoding in zip(
            face_locations, face_encodings
        ):
            results = face_recognition.compare_faces(
                [known_encoding], face_encoding, tolerance=args.tolerance
            )

            # Scale face box back up to the original frame size
            top *= 2
            right *= 2
            bottom *= 2
            left *= 2

            if True in results:
                status = "verified"
                color = (0, 255, 0)  # green
                label = "Verified Student"
            else:
                status = "not_matched"
                color = (0, 0, 255)  # red
                label = "Not Matched"

            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.putText(
                frame,
                label,
                (left, top - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                color,
                2,
            )

        # Print only when the status changes, so the console stays readable
        if status != last_status:
            if status == "verified":
                print("Verified Student")
            elif status == "not_matched":
                print("Not Matched")
            last_status = status

        cv2.imshow("Face Verification", frame)

        if cv2.waitKey(1) & 0xFF == 27:  # ESC key
            break

    video.release()
    cv2.destroyAllWindows()
    print("[INFO] Exited.")


if __name__ == "__main__":
    main()
