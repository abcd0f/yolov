import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { colors, boxBorderColor, boxOpacity, fontColor, fontSize, BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH } from './param';

const { VITE_PUBLIC_PATH } = import.meta.env;

interface BoxData {
  id: string;
  text: string;
}

interface BoxDimensions {
  width: number;
  height: number;
  depth: number;
}

class Box {
  private readonly cube: THREE.Mesh;
  private readonly edges: THREE.LineSegments;
  private readonly dimensions: BoxDimensions;
  private readonly data: BoxData;
  private textMesh?: THREE.Mesh;

  constructor(scene: THREE.Scene, data: BoxData) {
    this.data = data;
    this.dimensions = {
      width: BOX_WIDTH,
      height: BOX_HEIGHT,
      depth: BOX_DEPTH
    };

    // 创建几何体和材质
    const { cube, edges } = this.createBoxMesh();
    this.cube = cube;
    this.edges = edges;

    // 添加到场景
    scene.add(this.cube);
    scene.add(this.edges);

    // 异步加载字体
    this.loadAndCreateText(scene);
  }

  /**
   * 创建一个盒子网格模型及其边框
   */
  private createBoxMesh(): { cube: THREE.Mesh; edges: THREE.LineSegments } {
    const geometry = new THREE.BoxGeometry(this.dimensions.width, this.dimensions.height, this.dimensions.depth);

    // 创建网格材质，使用随机颜色和指定的不透明度
    const material = new THREE.MeshBasicMaterial({
      color: this.getRandomColor(),
      opacity: boxOpacity,
      transparent: true
    });

    // 创建盒子网格模型，并将当前实例的相关数据存储在userData中
    const cube = new THREE.Mesh(geometry, material);
    cube.userData = { boxInstance: this };

    // 创建盒子边框几何体
    const edgeGeometry = new THREE.EdgesGeometry(geometry);
    // 创建边框材质
    const edgeMaterial = new THREE.LineBasicMaterial({ color: boxBorderColor });
    // 创建盒子边框
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

    // 返回盒子网格模型和边框
    return { cube, edges };
  }

  /** 随机颜色 */
  private getRandomColor(): THREE.Color {
    return new THREE.Color(colors[Math.floor(Math.random() * colors.length)]);
  }

  /*** 加载字体并创建文字 */
  private async loadAndCreateText(scene: THREE.Scene): Promise<void> {
    try {
      // 创建字体加载器
      const loader = new FontLoader();
      // 加载字体
      const font = await this.loadFont(loader);

      // 创建文字网格
      const textMesh = this.createTextMesh(font);
      // 定位文字
      this.positionText(textMesh);
      this.textMesh = textMesh;
      scene.add(textMesh);
    } catch (error) {
      console.error('Error loading font:', error);
    }
  }

  /**
   * 使用FontLoader异步加载字体资源
   */
  private loadFont(loader: FontLoader) {
    return new Promise((resolve, reject) => {
      loader.load(`${VITE_PUBLIC_PATH}three/font.json`, resolve, undefined, reject);
    });
  }

  /**
   * 创建文本网格
   */
  private createTextMesh(font: any): THREE.Mesh {
    // 创建一个基本材质，设置颜色、透明度和双面渲染
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(fontColor),
      transparent: true,
      side: THREE.DoubleSide
    });

    // 根据字体和文本数据生成形状
    const shapes = font.generateShapes(this.data.text, fontSize);
    // 创建形状几何体
    const geometry = new THREE.ShapeGeometry(shapes);
    // 计算边界框，用于后续的变换操作
    geometry.computeBoundingBox();
    // 将几何体居中
    geometry.translate(0, 0, 0);
    return new THREE.Mesh(geometry, material);
  }

  /**
   * 调整文本的位置和旋转，使其相对于立方体的位置和尺寸正确显示
   */
  private positionText(textMesh: THREE.Mesh): void {
    textMesh.position.set(
      this.cube.position.x - this.dimensions.width / 2,
      this.cube.position.y + this.dimensions.height / 2,
      this.cube.position.z + this.dimensions.depth / 2 - 3
    );
    textMesh.rotation.set(-Math.PI / 2, 0, 0);
  }

  public updatePosition(x: number, y: number, z: number): void {
    this.cube.position.set(x, y, z);
    this.edges.position.set(x, y, z);

    if (this.textMesh) {
      this.positionText(this.textMesh);
    }
  }

  public getData(): BoxData {
    return this.data;
  }

  public getMesh(): THREE.Mesh {
    return this.cube;
  }
}

export default Box;
