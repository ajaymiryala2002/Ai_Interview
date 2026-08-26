const tf = require('@tensorflow/tfjs-core');
require('@tensorflow/tfjs-backend-cpu');
const faceapi = require('face-api.js');
const { Jimp } = require('jimp');

async function loadImageAsTensor(url) {
  const buf = require('fs').readFileSync(url);
  const image = await Jimp.read(buf);
  const { width, height, data } = image.bitmap;
  const float32Data = new Float32Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const j = (y * width + x) * 3;
      float32Data[j] = data[i];
      float32Data[j + 1] = data[i + 1];
      float32Data[j + 2] = data[i + 2];
    }
  }
  return tf.tensor3d(float32Data, [height, width, 3]);
}

(async () => {
  await tf.setBackend('cpu');
  await tf.ready();
  const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

  const imgPath = process.argv[2] || (require('path').join(__dirname, '..', 'backend', 'public', 'uploads', 'candidates', require('fs').readdirSync(require('path').join(__dirname, '..', 'backend', 'public', 'uploads', 'candidates'))[0]));
  console.log('Using image:', imgPath);
  const t1 = await loadImageAsTensor(imgPath);
  const t2 = await loadImageAsTensor(imgPath);

  const d1 = await faceapi.detectSingleFace(t1, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
  const d2 = await faceapi.detectSingleFace(t2, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();

  if (!d1 || !d2) {
    console.log('Face not detected');
    process.exit(1);
  }
  const dist = faceapi.euclideanDistance(d1.descriptor, d2.descriptor);
  console.log('Distance:', dist.toFixed(3), 'Score:', (1 - dist).toFixed(3));
})();
