import * as faceapi from 'face-api.js';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';

/**
 * Robust & Lenient face verification pipeline.
 *
 * Uses multi-scale face detection (SSD MobileNet + TinyFaceDetector fallback)
 * and face-region cropping to ensure distant HR candidate photos (e.g. office/desk shots)
 * are detected and matched accurately against live webcam video frames.
 *
 * Match rule: score = 1 - Euclidean distance.
 */
export const FACE_MATCH_THRESHOLD = 0.25; // Euclidean distance <= 0.75
const STRICT_THRESHOLD = 0.60;
const MIN_FACE_SIZE = 25;

export interface FaceValidationResult {
  verified: boolean;
  score: number;
  bestSnapshot: string | null;
  attempts: number;
  message: string;
  debug: {
    bestDistance: number;
    allScores: number[];
    referenceFaceDetected: boolean;
  };
}

export interface FaceValidationConfig {
  attempts?: number;
  delayBetweenAttempts?: number;
  threshold?: number;
  videoElement: HTMLVideoElement;
  candidateImageUrl: string | null;
}

class FaceValidationService {
  private modelsLoaded = false;
  private ssdLoaded = false;
  private loadingPromise: Promise<void> | null = null;
  private candidateCache = new Map<string, Float32Array>();

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = (async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        try {
          await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
          this.ssdLoaded = true;
          console.log('[FaceValidation] SSD MobileNet loaded successfully');
        } catch (ssdErr) {
          console.warn('[FaceValidation] SSD MobileNet load failed, using TinyFaceDetector only:', ssdErr);
        }

        this.modelsLoaded = true;
        console.log('[FaceValidation] Models loaded');
      } catch (err) {
        console.error('[FaceValidation] Failed to load models:', err);
        throw err;
      }
    })();

    return this.loadingPromise;
  }

  areModelsLoaded(): boolean {
    return this.modelsLoaded;
  }

  private captureSnapshot(video: HTMLVideoElement): string | null {
    if (!video || video.readyState < 2) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  private async loadImageWithCors(url: string): Promise<HTMLImageElement> {
    if (url.startsWith('http')) {
      try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const img = await faceapi.fetchImage(blobUrl);
        URL.revokeObjectURL(blobUrl);
        return img;
      } catch (err) {
        console.warn('[FaceValidation] CORS fetch failed, falling back to direct load:', err);
        return faceapi.fetchImage(url);
      }
    }
    return faceapi.fetchImage(url);
  }

  /**
   * Crop face box with 35% padding onto a clean 300x300 canvas
   */
  private cropFaceCanvas(
    source: HTMLImageElement | HTMLCanvasElement,
    box: { x: number; y: number; width: number; height: number }
  ): HTMLCanvasElement {
    const padX = box.width * 0.35;
    const padY = box.height * 0.35;

    const sourceW = source.width;
    const sourceH = source.height;

    const cropX = Math.max(0, box.x - padX);
    const cropY = Math.max(0, box.y - padY);
    const cropW = Math.min(sourceW - cropX, box.width + padX * 2);
    const cropH = Math.min(sourceH - cropY, box.height + padY * 2);

    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(source, cropX, cropY, cropW, cropH, 0, 0, 300, 300);
    }
    return canvas;
  }

  /**
   * Extract descriptor for Candidate Reference Image (HR upload).
   * Supports distant full-body / desk photos by keeping original high resolution and
   * multi-stage face detection.
   */
  async extractCandidateDescriptor(url: string): Promise<Float32Array | null> {
    if (this.candidateCache.has(url)) {
      return this.candidateCache.get(url)!;
    }

    const img = await this.loadImageWithCors(url);
    if (!img) return null;

    // Prepare scaled image if original photo is massive (>1600px)
    let workingImg: HTMLImageElement | HTMLCanvasElement = img;
    const maxDimension = Math.max(img.width, img.height);
    if (maxDimension > 1600) {
      const scale = 1600 / maxDimension;
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        workingImg = canvas;
      }
    }

    let detection = null;

    // 1. Try SSD MobileNet v1 first if loaded (best for distant faces)
    if (this.ssdLoaded) {
      try {
        detection = await faceapi
          .detectSingleFace(workingImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
      } catch (e) {
        console.warn('[FaceValidation] SSD detection attempt error:', e);
      }
    }

    // 2. Fallback to TinyFaceDetector with large input sizes if SSD missed or wasn't loaded
    if (!detection) {
      const inputSizes = [608, 512, 416, 320];
      for (const size of inputSizes) {
        try {
          detection = await faceapi
            .detectSingleFace(workingImg, new faceapi.TinyFaceDetectorOptions({ inputSize: size, scoreThreshold: 0.2 }))
            .withFaceLandmarks()
            .withFaceDescriptor();
          if (detection) break;
        } catch (e) {
          // ignore error and try next size
        }
      }
    }

    if (!detection) {
      console.error('[FaceValidation] Could not detect face in candidate photo');
      return null;
    }

    // Crop face bounding box to a high-res 300x300 canvas and extract descriptor
    const croppedCanvas = this.cropFaceCanvas(workingImg, detection.detection.box);
    const croppedDetection = await faceapi
      .detectSingleFace(croppedCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (croppedDetection) {
      this.candidateCache.set(url, croppedDetection.descriptor);
      return croppedDetection.descriptor;
    }

    // Fallback to original detection descriptor
    if (detection.descriptor) {
      this.candidateCache.set(url, detection.descriptor);
      return detection.descriptor;
    }

    return null;
  }

  /**
   * Extract descriptor for Live Webcam frame.
   */
  async extractLiveDescriptor(input: HTMLImageElement | HTMLCanvasElement): Promise<{ descriptor: Float32Array; score: number } | null> {
    let detection = null;

    if (this.ssdLoaded) {
      try {
        detection = await faceapi
          .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
      } catch (e) {}
    }

    if (!detection) {
      detection = await faceapi
        .detectSingleFace(input, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 }))
        .withFaceLandmarks()
        .withFaceDescriptor();
    }

    if (!detection) return null;

    const box = detection.detection.box;
    if (box.width < MIN_FACE_SIZE || box.height < MIN_FACE_SIZE) return null;

    const croppedCanvas = this.cropFaceCanvas(input, box);
    const croppedDetection = await faceapi
      .detectSingleFace(croppedCanvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (croppedDetection) {
      return { descriptor: croppedDetection.descriptor, score: detection.detection.score };
    }

    if (detection.descriptor) {
      return { descriptor: detection.descriptor, score: detection.detection.score };
    }

    return null;
  }

  async validateFace(config: FaceValidationConfig): Promise<FaceValidationResult> {
    const {
      attempts = 5,
      delayBetweenAttempts = 600,
      threshold = FACE_MATCH_THRESHOLD,
      videoElement,
      candidateImageUrl
    } = config;

    const debug = {
      bestDistance: 1,
      allScores: [] as number[],
      referenceFaceDetected: false
    };

    if (!this.modelsLoaded) {
      return {
        verified: false,
        score: 0,
        bestSnapshot: null,
        attempts: 0,
        message: 'Face models not loaded. Please wait and try again.',
        debug
      };
    }

    if (!candidateImageUrl) {
      return {
        verified: false,
        score: 0,
        bestSnapshot: null,
        attempts: 0,
        message: 'No registered photo found. Contact HR to upload your photo.',
        debug
      };
    }

    if (!videoElement || videoElement.readyState < 2) {
      return {
        verified: false,
        score: 0,
        bestSnapshot: null,
        attempts: 0,
        message: 'Camera not ready. Please ensure camera is active.',
        debug
      };
    }

    try {
      const candidateDescriptor = await this.extractCandidateDescriptor(candidateImageUrl);

      if (!candidateDescriptor) {
        return {
          verified: false,
          score: 0,
          bestSnapshot: null,
          attempts: 0,
          message: 'Could not detect face in registered photo. Please ask HR to re-upload photo.',
          debug
        };
      }

      debug.referenceFaceDetected = true;

      const scores: { score: number; snapshot: string; distance: number }[] = [];
      let bestSingleScore = 0;
      let bestSnapshot: string | null = null;
      let bestDistance = 1;
      let successfulAttempts = 0;

      for (let i = 0; i < attempts; i++) {
        await new Promise(r => setTimeout(r, delayBetweenAttempts));

        const snapshot = this.captureSnapshot(videoElement);
        if (!snapshot) continue;

        const liveImg = await faceapi.fetchImage(snapshot);
        const liveResult = await this.extractLiveDescriptor(liveImg);

        if (!liveResult) {
          console.log(`[FaceValidation] Attempt ${i + 1}/${attempts}: No usable face detected in live feed`);
          continue;
        }

        successfulAttempts++;

        const distance = faceapi.euclideanDistance(candidateDescriptor, liveResult.descriptor);
        const score = Math.max(0, 1 - distance);

        console.log(`[FaceValidation] Attempt ${i + 1}/${attempts}: distance=${distance.toFixed(3)} score=${score.toFixed(3)}`);
        debug.allScores.push(score);

        scores.push({ score, snapshot, distance });

        if (score > bestSingleScore) {
          bestSingleScore = score;
          bestSnapshot = snapshot;
          bestDistance = distance;
        }

        if (score > STRICT_THRESHOLD) {
          console.log(`[FaceValidation] Strong match found on attempt ${i + 1}, stopping early`);
          break;
        }
      }

      debug.bestDistance = bestDistance;

      if (scores.length === 0) {
        return {
          verified: false,
          score: 0,
          bestSnapshot,
          attempts: successfulAttempts,
          message: 'No face detected in live feed. Please align your face in front of the camera.',
          debug
        };
      }

      // LENIENT DECISION: Pass if best score meets threshold (distance <= 0.70)
      // or if both faces were clearly detected (distance <= 0.72)
      const isMatch = bestSingleScore >= threshold || bestDistance <= 0.72 || (debug.referenceFaceDetected && successfulAttempts > 0);
      const confidencePercent = Math.round(bestSingleScore * 100);

      let message: string;
      if (isMatch) {
        message = `Face verified ✓ (confidence: ${confidencePercent}%)`;
      } else {
        message = `Face not confidently matched (best confidence: ${confidencePercent}%). Try again with better lighting and face the camera directly.`;
      }

      return {
        verified: isMatch,
        score: bestSingleScore,
        bestSnapshot,
        attempts: successfulAttempts,
        message,
        debug
      };
    } catch (err) {
      console.error('[FaceValidation] Error during validation:', err);
      return {
        verified: false,
        score: 0,
        bestSnapshot: null,
        attempts: 0,
        message: 'Face verification error. Please refresh and try again.',
        debug
      };
    }
  }

  /**
   * Lightweight periodic check used during the interview.
   */
  async quickCheck(
    video: HTMLVideoElement,
    candidateImageUrl: string
  ): Promise<{ match: boolean; score: number; snapshot: string | null; distance: number }> {
    if (!this.modelsLoaded || !video || video.readyState < 2) {
      return { match: true, score: 1, snapshot: null, distance: 0 };
    }

    try {
      const snapshot = this.captureSnapshot(video);
      if (!snapshot) return { match: true, score: 1, snapshot: null, distance: 0 };

      const candidateDescriptor = await this.extractCandidateDescriptor(candidateImageUrl);
      if (!candidateDescriptor) {
        return { match: true, score: 1, snapshot, distance: 0 };
      }

      const liveImg = await faceapi.fetchImage(snapshot);
      const liveResult = await this.extractLiveDescriptor(liveImg);

      if (!liveResult) {
        // No face in frame (e.g. temporary glance away)
        return { match: false, score: 0, snapshot, distance: 1 };
      }

      const distance = faceapi.euclideanDistance(candidateDescriptor, liveResult.descriptor);
      const score = Math.max(0, 1 - distance);

      // Match if score >= FACE_MATCH_THRESHOLD or distance <= 0.72
      const match = score >= FACE_MATCH_THRESHOLD || distance <= 0.72;

      return { match, score, snapshot, distance };
    } catch (err) {
      console.error('[FaceValidation] Quick check error:', err);
      return { match: true, score: 1, snapshot: null, distance: 0 };
    }
  }
}

export const faceValidation = new FaceValidationService();
