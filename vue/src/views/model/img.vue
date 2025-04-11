<template>
  <div class="container">
    <div class="content">
      <el-button type="primary" @click="toPage">实时识别</el-button>
      <div class="image-container" v-loading="state.loading">
        <div class="wrap">
          <canvas ref="canvasRef"></canvas>
        </div>
      </div>
      <div class="controls">
        <el-space>
          <el-upload class="upload-demo" action="" :auto-upload="false" :show-file-list="false" accept="image/*" @change="handleFileChange">
            <el-button type="primary">点击上传</el-button>
          </el-upload>
          <el-button @click="handleClear" :disabled="!state.hasImage">清除</el-button>
        </el-space>

        <div class="stats" v-if="state.inferCount > 0">
          <p>推理次数: {{ state.inferCount }}</p>
          <p>推理时间: {{ state.lastInferTime.toFixed(2) }} ms</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import * as ort from 'onnxruntime-web/webgpu';
import { process_output } from './utils/config';
import { useRouter } from 'vue-router';

const router = useRouter();

interface State {
  loading: boolean;
  hasImage: boolean;
  inferCount: number;
  lastInferTime: number;
  boxes: any[];
}

const canvasRef = ref<HTMLCanvasElement | null>(null);
let model: ort.InferenceSession | null = null;

const state = reactive<State>({
  loading: true,
  hasImage: false,
  inferCount: 0,
  lastInferTime: 0,
  boxes: []
});

const loadModel = async () => {
  try {
    const { VITE_PUBLIC_PATH } = import.meta.env;

    ort.env.wasm.wasmPaths = `${VITE_PUBLIC_PATH}wasm/`;

    console.log(ort, '11111');
    model = await ort.InferenceSession.create(`${VITE_PUBLIC_PATH}model/yolov8n.onnx`, {
      executionProviders: ['webgpu']
    });
    if (!model) {
      await loadModel();
    }
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

    console.log(outputs, 'outputs');

    return outputs['output0'].data as Float32Array;
  } catch (error) {
    console.error('Error running model:', error);
    return null;
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
    input[j] = imageData[i] / 255;
    input[j + 640 * 640] = imageData[i + 1] / 255;
    input[j + 2 * 640 * 640] = imageData[i + 2] / 255;
  }

  return input;
};

const drawBoxes = (canvas: HTMLCanvasElement, boxes: any[]) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

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
};

const detect = async (canvas: HTMLCanvasElement) => {
  const input = prepareInput(canvas);
  if (!input) return;

  console.log(input, 'input');

  const startTime = performance.now();
  const output = await runModel(input);

  console.log(output, 'output');

  const endTime = performance.now();

  if (output) {
    state.inferCount++;
    state.lastInferTime = endTime - startTime;
    state.boxes = process_output(output, canvas.width, canvas.height);

    console.log(state.boxes, 'state.boxes');

    drawBoxes(canvas, state.boxes);
  }
};

const handleFileChange = async (file: any) => {
  state.loading = true;
  if (!canvasRef.value) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.onload = async () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    state.hasImage = true;
    // Automatically run detection after image is loaded
    await detect(canvas);
  };
  img.src = URL.createObjectURL(file.raw);

  state.loading = false;
};

const handleClear = () => {
  if (!canvasRef.value) return;

  const ctx = canvasRef.value.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
  state.hasImage = false;
  state.boxes = [];
};

const toPage = () => {
  router.push('/model');
};

onMounted(async () => {
  await loadModel();
});
</script>

<style scoped>
.container {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  background-color: #000;
}

.topage {
  position: absolute;
  top: 0;
  left: 0;
}

.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.image-container {
  position: relative;
  width: 640px;
  min-height: 480px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wrap {
  width: 100%;
  height: 100%;
}

canvas {
  max-width: 100%;
  max-height: 100%;
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

:deep(.el-upload-dragger) {
  width: 360px;
  height: 180px;
}
</style>
