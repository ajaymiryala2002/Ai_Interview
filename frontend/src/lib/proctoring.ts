import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export type ProctorEvent = 'NO_FACE' | 'MULTIPLE_FACES' | 'RESTRICTED_OBJECT' | 'TAB_SWITCH' | 'HEAVY_NOISE';

/**
 * Text-To-Speech (TTS) Voice Alert helper.
 * Speaks an audible warning message through browser audio.
 */
export function speakVoiceWarning(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel(); // stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[Proctoring] Voice warning error:', err);
    }
  }
}

export class ProctoringService {
  private model: cocoSsd.ObjectDetection | null = null;
  private intervalId: NodeJS.Timeout | null = null;
  private onEventFlagged: (event: ProctorEvent, snapshot?: string) => void;
  private currentVideoElement: HTMLVideoElement | null = null;
  private lastTabSwitchTime = 0;

  // Audio proctoring fields
  private audioContext: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioStreamSource: MediaStreamAudioSourceNode | null = null;

  constructor(onEventFlagged: (event: ProctorEvent, snapshot?: string) => void) {
    this.onEventFlagged = onEventFlagged;
  }

  async initialize() {
    this.model = await cocoSsd.load();
    console.log('Proctoring models loaded');
  }

  startProctoring(videoElement: HTMLVideoElement, stream?: MediaStream) {
    this.currentVideoElement = videoElement;

    // Listen for tab switching and window blur
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('blur', this.handleBlur);
    }

    if (stream && typeof window !== 'undefined') {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioContext = new AudioContextClass();
        this.audioAnalyser = this.audioContext.createAnalyser();
        this.audioStreamSource = this.audioContext.createMediaStreamSource(stream);
        this.audioStreamSource.connect(this.audioAnalyser);
        this.audioAnalyser.fftSize = 256;
      } catch (err) {
        console.warn('[Proctoring] Failed to initialize audio analysis:', err);
      }
    }

    this.intervalId = setInterval(async () => {
      // 1. Video detection
      if (videoElement && videoElement.readyState === 4 && this.model) {
        const predictions = await this.model.detect(videoElement);
        
        let personCount = 0;
        let restrictedObjectDetected = false;
        
        predictions.forEach(p => {
          if (p.class === 'person') personCount++;
          // COCO-SSD classes: 'cell phone', 'laptop', 'book'
          if (['cell phone', 'laptop', 'book'].includes(p.class)) {
            restrictedObjectDetected = true;
          }
        });

        if (personCount === 0) {
          this.triggerEvent('NO_FACE', videoElement);
        } else if (personCount > 1) {
          this.triggerEvent('MULTIPLE_FACES', videoElement);
        }

        if (restrictedObjectDetected) {
          this.triggerEvent('RESTRICTED_OBJECT', videoElement);
        }
      }

      // 2. Audio noise detection
      if (this.audioAnalyser) {
        const dataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
        this.audioAnalyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const average = sum / dataArray.length;

        // If average volume exceeds threshold (e.g. 45), flag heavy noise
        if (average > 45) {
          console.warn('[Proctoring] Heavy noise detected:', average);
          this.triggerEvent('HEAVY_NOISE', videoElement);
        }
      }
    }, 3000);
  }

  private handleVisibilityChange = () => {
    if (document.hidden) {
      const now = Date.now();
      if (now - this.lastTabSwitchTime > 3000) { // throttle duplicate logs within 3s
        this.lastTabSwitchTime = now;
        console.warn('[Proctoring] Tab switch detected!');
        speakVoiceWarning('Warning! Do not change tabs. Please return to your interview.');
        
        if (this.currentVideoElement) {
          this.triggerEvent('TAB_SWITCH', this.currentVideoElement);
        } else {
          this.onEventFlagged('TAB_SWITCH');
        }
      }
    }
  };

  private handleBlur = () => {
    const now = Date.now();
    if (now - this.lastTabSwitchTime > 3000) {
      this.lastTabSwitchTime = now;
      console.warn('[Proctoring] Window focus lost / Tab change detected!');
      speakVoiceWarning('Warning! Do not change tabs. Please return to your interview.');
      
      if (this.currentVideoElement) {
        this.triggerEvent('TAB_SWITCH', this.currentVideoElement);
      } else {
        this.onEventFlagged('TAB_SWITCH');
      }
    }
  };

  private triggerEvent(type: ProctorEvent, video?: HTMLVideoElement) {
    let snapshot: string | undefined;
    try {
      if (video && video.readyState === 4) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        snapshot = canvas.toDataURL('image/jpeg', 0.5);
      }
    } catch (e) {
      console.warn('[Proctoring] Failed to capture snapshot for event:', type, e);
    }

    this.onEventFlagged(type, snapshot);
  }

  stopProctoring() {
    if (this.intervalId) clearInterval(this.intervalId);
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('blur', this.handleBlur);
    }
    try {
      this.audioStreamSource?.disconnect();
      this.audioContext?.close();
    } catch (e) {}
  }
}
