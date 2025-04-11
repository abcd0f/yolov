// worker.ts
import * as ort from 'onnxruntime-web';

let model: ort.InferenceSession | null = null;

const initializeOnnxRuntime = () => {
  // 确保WASM路径正确设置
  ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
};

const loadModel = async (modelPath: string) => {
  try {
    initializeOnnxRuntime();

    // 使用完整的URL加载模型
    model = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['wasm']
    });

    return true;
  } catch (error) {
    console.error('Model loading error:', error);
    return false;
  }
};

const runInference = async (input: Float32Array) => {
  if (!model) {
    throw new Error('Model not loaded');
  }

  try {
    const tensorInput = new ort.Tensor('float32', input, [1, 3, 640, 640]);
    const outputs = await model.run({ images: tensorInput });
    return outputs['output0'].data;
  } catch (error) {
    console.error('Inference error:', error);
    throw error;
  }
};

self.onmessage = async event => {
  const { type, payload } = event.data;

  switch (type) {
    case 'LOAD_MODEL':
      try {
        const success = await loadModel(payload);
        self.postMessage({
          type: success ? 'MODEL_LOADED' : 'ERROR',
          payload: success ? null : 'Model loading failed'
        });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          payload: error || 'Unknown model loading error'
        });
      }
      break;

    case 'RUN_INFERENCE':
      try {
        const result = await runInference(payload);
        self.postMessage({ type: 'INFERENCE_RESULT', payload: result });
      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          payload: error || 'Inference failed'
        });
      }
      break;
  }
};
