import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import SceneCreator from './creator/scene';
import RendererCreator from './creator/renderer';
import CameraCreator from './creator/camera';
import Floor from './floor';
import Area from './area';
import { AREA_A, AREA_B, AREA_A_POSITION, AREA_B_POSITION } from './param';

const { VITE_PUBLIC_PATH } = import.meta.env;

interface SceneOptions {
  backgroundColor?: THREE.Color | string | number;
}

class createThree {
  private sceneCreator: SceneCreator;
  private rendererCreator: RendererCreator;
  private cameraCreator: CameraCreator;
  private controls: OrbitControls;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private camera: THREE.PerspectiveCamera;
  private areas: Area[] = [];

  constructor(containerId: string, options?: SceneOptions) {
    // 创建各个组件
    this.sceneCreator = new SceneCreator(options);
    this.rendererCreator = new RendererCreator(containerId);
    this.cameraCreator = new CameraCreator(containerId);

    // 获取场景、渲染器、相机
    this.renderer = this.rendererCreator.getRenderer();
    this.scene = this.sceneCreator.getScene();
    this.camera = this.cameraCreator.getCamera();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // 创建地板
    new Floor(this.scene, `${VITE_PUBLIC_PATH}three/floorplan.png`);

    const area = new Area(this.scene, {
      position: AREA_A_POSITION,
      size: { width: AREA_A.width, height: AREA_A.height, depth: AREA_A.depth }
    });

    const area2 = new Area(this.scene, {
      position: AREA_B_POSITION,
      size: { width: AREA_B.width, height: AREA_B.height, depth: AREA_B.depth }
    });

    this.areas.push(area, area2);

    // 假设从API获取的数据
    const boxesData = [
      { id: '1', text: '苯' },
      { id: '2', text: '硝基苯' },
      { id: '3', text: '硝基苯' },
      { id: '4', text: '硝基苯' },
      { id: '5', text: '硝基苯' },
      { id: '6', text: '硝基苯' },
      { id: '7', text: '硝基苯' },
      { id: '3', text: '硝基苯' },
      { id: '4', text: '硝基苯' },
      { id: '5', text: '硝基苯' },
      { id: '6', text: '硝基苯' },
      { id: '7', text: '硝基苯' },
      { id: '3', text: '硝基苯' },
      { id: '4', text: '硝基苯' },
      { id: '5', text: '硝基苯' },
      { id: '6', text: '硝基苯' },
      { id: '7', text: '硝基苯' },
      { id: '3', text: '硝基苯' },
      { id: '4', text: '硝基苯' },
      { id: '5', text: '硝基苯' },
      { id: '6', text: '硝基苯' },
      { id: '7', text: '硝基苯' },
      { id: '3', text: '硝基苯' },
      { id: '4', text: '硝基苯' },
      { id: '5', text: '硝基苯' },
      { id: '6', text: '硝基苯' },
      { id: '7', text: '硝基苯' },
      { id: '3', text: '硝基苯' },
      { id: '4', text: '硝基苯' },
      { id: '5', text: '硝基苯' },
      { id: '6', text: '硝基苯' },
      { id: '7', text: '硝基苯' },
      { id: '8', text: '硝基苯' }
    ];

    // 创建boxes
    area.createBoxes(this.scene, boxesData);
    area2.createBoxes(this.scene, boxesData);

    // 创建轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true; // 启用阻尼（模拟惯性效果）

    // const axesHelper = new THREE.AxesHelper(2000);
    // this.scene.add(axesHelper);

    this.initScene(this.camera);

    // 分开处理：先执行初始化动画，然后启用普通渲染循环
    this.initializeAnimation(this.renderer, this.scene, this.camera);

    window.addEventListener('click', this.onMouseClick.bind(this));
  }

  private initScene(camera: THREE.PerspectiveCamera) {
    camera.position.set(1000, 1000, 2000);
    camera.lookAt(0, 0, 0);
  }

  private initializeAnimation(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const duration = 3000;
    const startPosition = camera.position.clone();
    const endPosition = new THREE.Vector3(500, 500, 1000);
    const startTime = Date.now();

    const animateInitial = () => {
      const elapsedTime = Date.now() - startTime;
      const t = Math.min(elapsedTime / duration, 1);

      camera.position.lerpVectors(startPosition, endPosition, t);
      this.controls.update();
      renderer.render(scene, camera);

      if (t < 1) {
        requestAnimationFrame(animateInitial);
      } else {
        // 初始化动画完成后，切换到普通渲染循环
        this.startNormalRenderLoop(renderer, scene, camera);
      }
    };

    animateInitial();
  }

  private startNormalRenderLoop(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      renderer.render(scene, camera);
    };
    animate();
  }

  private onMouseClick(event: MouseEvent): void {
    // 计算鼠标在归一化设备坐标中的位置
    const container = this.rendererCreator.getRenderer().domElement;
    const rect = container.getBoundingClientRect();

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // 更新射线
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 收集所有的 box mesh 进行检测
    const boxMeshes: THREE.Mesh[] = [];
    this.areas.forEach(area => {
      area.getBoxes().forEach(box => {
        boxMeshes.push(box.getMesh());
      });
    });

    // 进行射线检测
    const [intersect] = this.raycaster.intersectObjects(boxMeshes);

    if (intersect?.object?.userData?.boxInstance) {
      const { boxInstance } = intersect.object.userData;
      const boxData = boxInstance.getData();
      this.onBoxClicked(boxData);
    }
  }

  private onBoxClicked(boxData: any): void {
    console.log('点击', boxData);
  }

  /** 保存为图片 */
  exportAsImage(): Promise<string> {
    return new Promise(resolve => {
      // 确保在导出前渲染最新的场景状态
      this.renderer.render(this.scene, this.camera);

      // 使用 requestAnimationFrame 确保渲染完成后再导出
      requestAnimationFrame(() => {
        const dataURL = this.renderer.domElement.toDataURL('image/png');
        resolve(dataURL);
      });
    });
  }
}

export default createThree;
