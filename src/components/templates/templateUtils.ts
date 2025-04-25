import { fabric } from 'fabric';
import { Template } from './types';

/**
 * 將模板應用到畫布
 * @param canvas 要應用模板的畫布
 * @param template 要應用的模板
 * @returns 返回操作是否成功
 */
export const applyTemplate = (canvas: fabric.Canvas, template: Template): boolean => {
  try {
    // 清空當前畫布
    canvas.clear();
    
    // 從模板JSON數據恢復畫布狀態
    canvas.loadFromJSON(template.canvasData, () => {
      canvas.renderAll();
    });
    
    return true;
  } catch (error) {
    console.error('應用模板失敗:', error);
    return false;
  }
};

/**
 * 格式化模板創建時間
 * @param timestamp 時間戳
 * @returns 格式化後的時間字符串
 */
export const formatTemplateDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 