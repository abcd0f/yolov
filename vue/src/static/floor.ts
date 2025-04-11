import * as THREE from 'three';
import { floorConfig } from './param';

class Floor {
  private scene: THREE.Scene; // 场景对象
  private imageUrl: string; // 图片的 URL
  private cube: THREE.Mesh | null = null; // 立方体网格

  constructor(scene: THREE.Scene, imageUrl: string) {
    this.scene = scene;
    this.imageUrl = imageUrl;
    this.initFloor();
  }

  // 初始化地面
  private initFloor(): void {
    const { w: floorWidth, h: floorHeight, d: floorDepth, color } = floorConfig;

    // 纹理加载
    new THREE.TextureLoader().load(
      this.imageUrl,
      texture => this.createCube(floorWidth, floorHeight, floorDepth, color, texture), // 加载成功后创建地面
      undefined,
      () => console.error('Texture load failed') // 纹理加载失败处理
    );
  }

  // 创建立方体
  private createCube(width: number, height: number, depth: number, color: number, texture: THREE.Texture): void {
    // 创建材质并指定双面显示
    const defaultMaterial = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const textureMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

    // 设置材质数组
    const materialArray = [
      defaultMaterial, // 前面
      defaultMaterial, // 后面
      textureMaterial, // 上面
      defaultMaterial, // 下面
      defaultMaterial, // 左面
      defaultMaterial // 右面
    ];

    // 创建几何体和网格对象
    const geometry = new THREE.BoxGeometry(width, height, depth);
    this.cube = new THREE.Mesh(geometry, materialArray);
    this.cube.position.y = -10;
    this.scene.add(this.cube);
  }
}

export default Floor;
