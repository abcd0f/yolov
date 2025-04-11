import * as THREE from 'three';

interface SceneOptions {
  backgroundColor?: THREE.Color | string | number;
}

class SceneCreator {
  private scene: THREE.Scene;

  constructor(options?: SceneOptions) {
    this.scene = new THREE.Scene();

    // 应用选项配置
    if (options?.backgroundColor) {
      this.scene.background = new THREE.Color(options.backgroundColor);
    }

    // 应用雾效配置
    // this.scene.fog = new THREE.Fog(0xffffff, 1, 2000);
  }

  // 添加物体到场景
  addObject(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  // 从场景移除物体
  removeObject(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  // 获取场景
  getScene(): THREE.Scene {
    return this.scene;
  }
}

export default SceneCreator;
