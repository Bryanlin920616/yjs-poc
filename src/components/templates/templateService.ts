import { Template, TemplateInput, TemplateService, TemplateStorage } from './types';

const LOCAL_STORAGE_KEY = 'canvas_templates';

/**
 * 從canvas生成縮略圖
 */
export const generateThumbnail = (canvas: fabric.Canvas): string => {
  // 保存當前尺寸
  const originalWidth = canvas.getWidth();
  const originalHeight = canvas.getHeight();
  
  try {
    // 縮小尺寸以生成縮略圖
    canvas.setDimensions({ width: 200, height: 150 }, { backstoreOnly: true });
    
    // 生成縮略圖
    const thumbnail = canvas.toDataURL({ 
      format: 'jpeg', 
      quality: 0.5,
      multiplier: 1 
    });
    
    return thumbnail;
  } catch (error) {
    console.error('生成縮略圖時出錯:', error);
    // 返回空白縮略圖
    return '';
  } finally {
    // 恢復原始尺寸
    canvas.setDimensions({ width: originalWidth, height: originalHeight }, { backstoreOnly: true });
  }
};

/**
 * 基於localStorage的模板服務實現
 */
export class LocalTemplateService implements TemplateService {
  /**
   * 獲取所有模板
   */
  async getTemplates(): Promise<Template[]> {
    try {
      const storageData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!storageData) {
        return [];
      }
      
      const data = JSON.parse(storageData) as TemplateStorage;
      return data.templates || [];
    } catch (error) {
      console.error('獲取模板失敗:', error);
      return [];
    }
  }

  /**
   * 獲取特定ID的模板
   */
  async getTemplate(id: string): Promise<Template | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * 保存新模板
   */
  async saveTemplate(input: TemplateInput): Promise<Template> {
    try {
      const templates = await this.getTemplates();
      
      // 生成新模板
      const newTemplate: Template = {
        id: crypto.randomUUID(), // 使用隨機ID
        name: input.name,
        description: input.description,
        thumbnail: generateThumbnail(input.canvas),
        canvasData: input.canvas.toJSON(),
        createdAt: Date.now()
      };
      
      // 添加到現有模板並存儲
      templates.push(newTemplate);
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        templates,
        lastUpdated: Date.now()
      }));
      
      return newTemplate;
    } catch (error) {
      console.error('保存模板失敗:', error);
      throw new Error('保存模板失敗');
    }
  }

  /**
   * 刪除模板
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      const templates = await this.getTemplates();
      const filteredTemplates = templates.filter(t => t.id !== id);
      
      // 如果大小相同表示沒有找到要刪除的模板
      if (filteredTemplates.length === templates.length) {
        return false;
      }
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        templates: filteredTemplates,
        lastUpdated: Date.now()
      }));
      
      return true;
    } catch (error) {
      console.error('刪除模板失敗:', error);
      return false;
    }
  }
}

// 創建並導出默認服務實例
export const templateService = new LocalTemplateService(); 