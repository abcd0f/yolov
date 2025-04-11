import * as THREE from 'three';

class RendererCreator {
  private renderer: THREE.WebGLRenderer;
  private resizeObserver: ResizeObserver;

  constructor(containerId: string) {
    // 获取指定 id 的容器元素
    const container = document.querySelector(containerId) as HTMLElement;
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    // 创建 WebGLRenderer，并启用抗锯齿
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.setSize(container);

    // 将 renderer 的 domElement 添加到容器中
    container.appendChild(this.renderer.domElement);

    // 使用 ResizeObserver 监听容器大小的变化
    this.resizeObserver = new ResizeObserver(() => this.setSize(container));
    this.resizeObserver.observe(container);
  }

  // 设置渲染器尺寸，接受容器作为参数
  private setSize(container: HTMLElement): void {
    const { clientWidth: width, clientHeight: height } = container;
    this.renderer.setSize(width, height);

    
  }

  // 获取渲染器实例
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  // 销毁时停止观察器，避免内存泄漏
  public dispose(): void {
    this.resizeObserver.disconnect();
  }
}

export default RendererCreator;
