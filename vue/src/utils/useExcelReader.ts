import { ref } from 'vue';
import * as XLSX from 'xlsx';
import type { UploadFile } from 'element-plus';

export function useExcelReader() {
  // 定义标题列数组
  const title = ref<string[]>([]);
  // 定义表格数据数组
  const tableData = ref<string[][]>([]); // 每一行是一个字符串数组，代表每一列的数据
  // 定义解析成功的状态
  const isParseSuccessful = ref<boolean>(false);

  // 读取文件并返回 ArrayBuffer 类型的 Promise
  function readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        resolve(event.target?.result as ArrayBuffer);
      };
      reader.onerror = error => {
        reject(error);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // 处理文件变化并解析 Excel 文件
  async function handleFileChange(file: UploadFile) {
    // 每次解析新文件时重置解析状态
    isParseSuccessful.value = false;

    if (file.raw) {
      try {
        const data = await readFile(file.raw as File);
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

        console.log(jsonData, 'jsonData');

        // 设置表头为 Excel 数据的第一行键名
        title.value = Object.keys(jsonData[0] as object);
        // 设置表数据，根据表头顺序提取对应的值
        tableData.value = jsonData.map(item => title.value.map(title => item[title]));

        // tableData.value = jsonData.map((item: any) => {
        //    const obj: { [key: string]: any } = {};
        //    title.value.forEach((key, index) => {
        //       obj[`in${index}`] = item[key];
        //    });
        //    return obj;
        // });

        console.log(tableData.value);

        // 解析成功时设置状态
        isParseSuccessful.value = true;
      } catch (error) {
        console.error('Error reading file:', error);
        // 解析失败保持状态为 false
      }
    }
  }

  return {
    title,
    tableData,
    isParseSuccessful,
    handleFileChange
  };
}
