import { fabric } from 'fabric';

/**
 * 模板數據結構
 */
export interface Template {
  id: string;        // 唯一標識符
  name: string;      // 模板名稱
  description?: string; // 可選描述
  thumbnail: string; // 縮略圖 (Base64格式)
  canvasData: object; // Fabric.js序列化的JSON數據
  createdAt: number; // 創建時間戳
}

/**
 * 新模板創建時的輸入數據
 */
export interface TemplateInput {
  name: string;
  description?: string;
  canvas: fabric.Canvas;
}

/**
 * 儲存在localStorage的數據結構
 */
export interface TemplateStorage {
  templates: Template[];
  lastUpdated: number;
}

/**
 * 模板服務接口
 * 提供獲取、保存和刪除模板的方法
 * 設計為接口以便將來替換為API實現
 */
export interface TemplateService {
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | null>;
  saveTemplate(input: TemplateInput): Promise<Template>;
  deleteTemplate(id: string): Promise<boolean>;
} 