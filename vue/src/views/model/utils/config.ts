const yolo_classes = [
  '人',
  '自行车',
  '汽车',
  '摩托车',
  '飞机',
  '公共汽车',
  '火车',
  '卡车',
  '船',
  '交通灯',
  '消防栓',
  '停车标志',
  '停车表',
  '长椅',
  '鸟',
  '猫',
  '狗',
  '马',
  '羊',
  '牛',
  '大象',
  '熊',
  '斑马',
  '长颈鹿',
  '背包',
  '雨伞',
  '手提包',
  '领带',
  '行李箱',
  '飞盘',
  '滑雪板',
  '滑雪板',
  '运动球',
  '风筝',
  '棒球棒',
  '棒球手套',
  '滑板',
  '冲浪板',
  '网球拍',
  '瓶子',
  '酒杯',
  '杯子',
  '叉子',
  '刀',
  '勺子',
  '碗',
  '香蕉',
  '苹果',
  '三明治',
  '橙子',
  '西兰花',
  '胡萝卜',
  '热狗',
  '披萨',
  '甜甜圈',
  '蛋糕',
  '椅子',
  '沙发',
  '盆栽植物',
  '床',
  '餐桌',
  '厕所',
  '电视',
  '笔记本电脑',
  '鼠标',
  '遥控器',
  '键盘',
  '手机',
  '微波炉',
  '烤箱',
  '烤面包机',
  '水槽',
  '冰箱',
  '书',
  '时钟',
  '花瓶',
  '剪刀',
  '泰迪熊',
  '吹风机',
  '牙刷'
];

export const iou = (box1: any, box2: any) => {
  return intersection(box1, box2) / union(box1, box2);
};

export const intersection = (box1: any, box2: any) => {
  const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
  const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
  const x1 = Math.max(box1_x1, box2_x1);
  const y1 = Math.max(box1_y1, box2_y1);
  const x2 = Math.min(box1_x2, box2_x2);
  const y2 = Math.min(box1_y2, box2_y2);
  return (x2 - x1) * (y2 - y1);
};

export const union = (box1: any, box2: any) => {
  const [box1_x1, box1_y1, box1_x2, box1_y2] = box1;
  const [box2_x1, box2_y1, box2_x2, box2_y2] = box2;
  const box1_area = (box1_x2 - box1_x1) * (box1_y2 - box1_y1);
  const box2_area = (box2_x2 - box2_x1) * (box2_y2 - box2_y1);
  return box1_area + box2_area - intersection(box1, box2);
};

export const process_output = (output: any, img_width: number, img_height: number): any[] => {
  let boxes = [] as any;
  for (let index = 0; index < 8400; index++) {
    const [class_id, prob] = [...Array(yolo_classes.length).keys()]
      .map(col => [col, output[8400 * (col + 4) + index]])
      .reduce((accum, item) => (item[1] > accum[1] ? item : accum), [0, 0]);
    if (prob < 0.5) {
      continue;
    }
    const label = yolo_classes[class_id];
    const xc = output[index];
    const yc = output[8400 + index];
    const w = output[2 * 8400 + index];
    const h = output[3 * 8400 + index];
    const x1 = ((xc - w / 2) / 640) * img_width;
    const y1 = ((yc - h / 2) / 640) * img_height;
    const x2 = ((xc + w / 2) / 640) * img_width;
    const y2 = ((yc + h / 2) / 640) * img_height;
    boxes.push([x1, y1, x2, y2, label, prob]);
  }

  boxes = boxes.sort((box1: any, box2: any) => box2[5] - box1[5]);
  const result = [];
  while (boxes.length > 0) {
    result.push(boxes[0]);
    boxes = boxes.filter((box: any) => iou(boxes[0], box) < 0.7);
  }
  return result;
};

export const prepare_input = (img: HTMLCanvasElement) => {
  console.log(img, '1111');

  if (!img || img.width === 0 || img.height === 0) {
    console.error('Invalid canvas size');
    return null;
  }

  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext('2d');

  if (!context) return;

  context.drawImage(img, 0, 0, 640, 640);
  const data = context.getImageData(0, 0, 640, 640).data;
  const red = [],
    green = [],
    blue = [];
  for (let index = 0; index < data.length; index += 4) {
    red.push(data[index] / 255);
    green.push(data[index + 1] / 255);
    blue.push(data[index + 2] / 255);
  }
  return [...red, ...green, ...blue];
};
