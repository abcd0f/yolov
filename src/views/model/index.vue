<template>
  <div class="container">
    <div class="content">
      <el-button type="primary" @click="toPage">照片识别</el-button>
      <div class="video-container" v-loading="state.loading">
        <video ref="videoRef" @loadeddata="handleVideoLoaded"></video>
        <div class="wrap">
          <canvas ref="canvasRef"></canvas>
        </div>
      </div>
      <div class="controls">
        <el-space>
          <el-button @click="handlePlay" :disabled="state.loading || state.isRunning">
            {{ state.isRunning ? '运行中' : '开始' }}
          </el-button>
          <el-button @click="handlePause" :disabled="!state.isRunning">暂停</el-button>
        </el-space>
        <div class="stats" v-if="state.inferCount > 0">
          <p>推理次数: {{ state.inferCount }}</p>
          <p>平均推理时间: {{ getAverageInferTime }} ms</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
// import * as ort from 'onnxruntime-web';
import * as ort from 'onnxruntime-web/webgpu';
import { process_output } from './utils/config';
import { useRouter } from 'vue-router';

const router = useRouter();

interface State {
  loading: boolean;
  isRunning: boolean;
  isVideoLoaded: boolean;
  inferCount: number;
  totalInferTime: number;
  boxes: any[];
}

const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
let animationFrameId: number | null = null;
let model: ort.InferenceSession | null = null;

const state = reactive<State>({
  loading: true,
  isRunning: false,
  isVideoLoaded: false,
  inferCount: 0,
  totalInferTime: 0,
  boxes: []
});

const getAverageInferTime = computed(() => (state.inferCount ? (state.totalInferTime / state.inferCount).toFixed(2) : '0'));

const loadModel = async () => {
  try {
    const { VITE_PUBLIC_PATH } = import.meta.env;
    ort.env.wasm.wasmPaths = `${VITE_PUBLIC_PATH}wasm/`;

    // model = await ort.InferenceSession.create(`${VITE_PUBLIC_PATH}model/yolov8n.onnx`);
    model = await ort.InferenceSession.create(`${VITE_PUBLIC_PATH}model/yolov8n.onnx`, { executionProviders: ['webgpu'] });
    if (!model) {
      await loadModel();
    }

    const cameraInitialized = await initCamera();
    if (!cameraInitialized) return;
    state.loading = false;
  } catch (error) {
    console.error('Error loading model:', error);
    state.loading = false;
  }
};

const runModel = async (input: Float32Array): Promise<Float32Array | null> => {
  if (!model) return null;

  try {
    const tensor = new ort.Tensor(input, [1, 3, 640, 640]);
    const outputs = await model.run({ images: tensor });

    console.log(outputs, '111111111');

    return outputs['output0'].data as Float32Array;
  } catch (error) {
    console.error('Error running model:', error);
    return null;
  }
};

const initCamera = async (): Promise<boolean> => {
  if (!videoRef.value) return false;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.value.srcObject = stream;
    return true;
  } catch (error) {
    console.error('Failed to access camera:', error);
    return false;
  }
};

const handleVideoLoaded = () => {
  state.isVideoLoaded = true;
  if (state.isRunning) {
    startInference();
  }
};

const prepareInput = (canvas: HTMLCanvasElement): Float32Array | null => {
  if (!canvas || canvas.width === 0 || canvas.height === 0) return null;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 640;
  tempCanvas.height = 640;
  const ctx = tempCanvas.getContext('2d');

  if (!ctx) return null;

  ctx.drawImage(canvas, 0, 0, 640, 640);
  const imageData = ctx.getImageData(0, 0, 640, 640).data;
  const input = new Float32Array(640 * 640 * 3);

  for (let i = 0, j = 0; i < imageData.length; i += 4, j++) {
    input[j] = imageData[i] / 255; // Red
    input[j + 640 * 640] = imageData[i + 1] / 255; // Green
    input[j + 2 * 640 * 640] = imageData[i + 2] / 255; // Blue
  }

  return input;
};

const drawBoxes = async (canvas: HTMLCanvasElement, boxes: any[]) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = '#00FF00';
  ctx.lineWidth = 3;
  ctx.font = '18px serif';

  boxes.forEach(([x1, y1, x2, y2, label]) => {
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

    ctx.fillStyle = '#00ff00';
    const width = ctx.measureText(label).width;
    ctx.fillRect(x1, y1, width + 10, 25);

    ctx.fillStyle = '#000000';
    ctx.fillText(label, x1, y1 + 18);
  });

  ctx.restore();
};

const startInference = async () => {
  const video = videoRef.value;
  const canvas = canvasRef.value;

  if (!video || !canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let animationFrameId = null as any;
  let frameCount = 0; // 帧计数器

  const processFrame = async () => {
    if (!state.isRunning) {
      cancelAnimationFrame(animationFrameId);
      return;
    }

    frameCount++;

    // 每 2 帧处理一次
    if (frameCount % 2 === 0) {
      ctx.drawImage(video, 0, 0);

      const input = prepareInput(canvas);
      if (input) {
        try {
          const startTime = performance.now();
          const output = await runModel(input);
          const endTime = performance.now();

          if (output) {
            state.inferCount++;
            state.totalInferTime += endTime - startTime;
            state.boxes = process_output(output, canvas.width, canvas.height);

            console.log(state.boxes, '检测到的框');

            await drawBoxes(canvas, state.boxes);
          }
        } catch (error) {
          console.error('推理过程中发生错误:', error);
        }
      }

      frameCount = 0; // 重置帧计数器
    }

    animationFrameId = requestAnimationFrame(processFrame);
  };

  // 开始执行帧处理
  processFrame();
};

const handlePlay = async () => {
  if (state.isRunning) return;

  state.isRunning = true;
  videoRef.value?.play();

  if (state.isVideoLoaded) {
    startInference();
  }
};

const handlePause = () => {
  state.isRunning = false;
  videoRef.value?.pause();
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
};

const toPage = () => {
  router.push('/img');
};

onMounted(async () => {
  await loadModel();
});

onUnmounted(() => {
  handlePause();
});
</script>

<style scoped>
.container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #000;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.video-container {
  position: relative;
  width: 640px;
  height: 480px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wrap {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

canvas {
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.controls {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.stats {
  text-align: center;
  font-size: 14px;
  color: #fff;
}

.stats p {
  margin: 5px 0;
}
</style>
