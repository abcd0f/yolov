import * as THREE from 'three';

class CameraCreator {
  camera: THREE.PerspectiveCamera;
  parentElement: HTMLElement;

  constructor(parentId: string, fov = 75, near = 0.1, far = 3000, positionZ = 5) {
    this.parentElement = document.querySelector(parentId) as HTMLElement;

    if (!this.parentElement) {
      throw new Error(`元素ID "${parentId}" 不存在`);
    }

    const aspectRatio = this.parentElement.clientWidth / this.parentElement.clientHeight;
    this.camera = new THREE.PerspectiveCamera(fov, aspectRatio, near, far);
    this.camera.position.z = positionZ;

    window.addEventListener('resize', this.updateAspectRatio.bind(this));
  }

  updateAspectRatio() {
    const width = this.parentElement.clientWidth;
    const height = this.parentElement.clientHeight;
    const aspectRatio = width / height;
    this.camera.aspect = aspectRatio;
    this.camera.updateProjectionMatrix();
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }
}

export default CameraCreator;
