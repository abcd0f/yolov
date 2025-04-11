import * as THREE from 'three';
import Box from './box';
import { boxGap, BOX_WIDTH, BOX_HEIGHT, BOX_DEPTH } from './param';

interface AreaConfig {
  position: { x: number; y: number; z: number };
  gap?: number;
  size: { width: number; height: number; depth: number };
}

interface BoxData {
  id: string;
  text: string;
}

class Area {
  private readonly cube: THREE.Mesh;
  private boxes = new Map<string, Box>();
  private currentPosition = { x: 0, y: 0, z: 0 };
  private readonly gap: number;
  private areaSize: { width: number; height: number; depth: number };
  private halfArea: { width: number; height: number; depth: number };
  private readonly areaPosition: THREE.Vector3;

  constructor(scene: THREE.Scene, config: AreaConfig) {
    this.gap = config.gap ?? boxGap;
    this.areaSize = config.size;

    this.halfArea = {
      width: this.areaSize.width / 2,
      height: this.areaSize.height / 2,
      depth: this.areaSize.depth / 2
    };

    this.areaPosition = new THREE.Vector3(config.position.x || 0, config.position.y || 0, config.position.z || 0);

    this.cube = new THREE.Mesh(
      new THREE.BoxGeometry(this.areaSize.width, this.areaSize.height, this.areaSize.depth),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, side: THREE.DoubleSide })
    );

    this.cube.position.copy(this.areaPosition);
    scene.add(this.cube);

    this.resetCurrentPosition();
  }

  /**
   * 重置当前位置
   */
  private resetCurrentPosition(): void {
    this.currentPosition = {
      x: this.areaPosition.x - this.halfArea.width,
      y: this.areaPosition.y - this.halfArea.height,
      z: this.areaPosition.z - this.halfArea.depth
    };
  }

  /** 检查盒子是否能适应给定的位置 */
  private canFitBox(position: { x: number; y: number; z: number }): boolean {
    return (
      position.x + BOX_WIDTH / 2 <= this.areaPosition.x + this.halfArea.width &&
      position.y + BOX_HEIGHT / 2 <= this.areaPosition.y + this.halfArea.height &&
      position.z + BOX_DEPTH / 2 <= this.areaPosition.z + this.halfArea.depth
    );
  }

  /**
   * 获取下一个盒子的位置
   */
  private getNextPosition(): { x: number; y: number; z: number } | null {
    const pos = { ...this.currentPosition };

    // 检查当前盒子在z轴方向是否超出区域范围
    if (pos.z + BOX_DEPTH + this.gap > this.areaPosition.z + this.halfArea.depth) {
      // 超出时，调整z轴位置到区域起始位置，并在x轴方向移动一个盒子宽度加上间距
      pos.z = this.areaPosition.z - this.halfArea.depth + BOX_DEPTH / 2 + this.gap;
      pos.x += BOX_WIDTH + this.gap;

      // 检查当前盒子在x轴方向是否超出区域范围
      if (pos.x + BOX_WIDTH + this.gap > this.areaPosition.x + this.halfArea.width) {
        // 超出时，调整x轴位置到区域起始位置，并在y轴方向移动一个盒子高度加上间距
        pos.x = this.areaPosition.x - this.halfArea.width + BOX_WIDTH / 2 + this.gap;
        pos.y += BOX_HEIGHT + this.gap;

        // 检查当前盒子在y轴方向是否超出区域范围
        if (pos.y + BOX_HEIGHT + this.gap > this.areaPosition.y + this.halfArea.height) {
          // 超出时，表示无法在区域内放置更多的盒子，返回null
          return null;
        }
      }
    }

    return pos;
  }

  /** 在当前场景中放置一个箱子 */
  private placeBox(scene: THREE.Scene, boxData: BoxData): boolean {
    if (!this.canFitBox(this.currentPosition)) {
      const nextPos = this.getNextPosition();
      if (!nextPos) return false;
      this.currentPosition = nextPos;
    }

    const box = new Box(scene, boxData);
    box.updatePosition(
      this.currentPosition.x + BOX_WIDTH / 2,
      this.currentPosition.y + BOX_HEIGHT / 2,
      this.currentPosition.z + BOX_DEPTH / 2
    );

    this.boxes.set(boxData.id, box);
    this.currentPosition.z += BOX_DEPTH + this.gap;

    return true;
  }

  /** 循环创建箱子 */
  public createBoxes(scene: THREE.Scene, boxesData: BoxData[]): boolean {
    for (const boxData of boxesData) {
      if (!this.placeBox(scene, boxData)) {
        console.warn(`Unable to place box with ID: ${boxData.id}. Area might be full.`);
        return false;
      }
    }
    return true;
  }

  public getBoxes(): Map<string, Box> {
    return this.boxes;
  }
}

export default Area;
