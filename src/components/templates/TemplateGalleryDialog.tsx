import React, { useEffect, useState } from 'react';
import Dialog from './Dialog';
import { Template } from './types';
import { templateService } from './templateService';
import { formatTemplateDate, applyTemplate } from './templateUtils';

interface TemplateGalleryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: fabric.Canvas | null;
}

interface ConfirmDialogState {
  isOpen: boolean;
  templateId: string | null;
}

const TemplateGalleryDialog: React.FC<TemplateGalleryDialogProps> = ({ 
  isOpen, 
  onClose, 
  canvas 
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 確認對話框的狀態
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    templateId: null
  });

  // 載入模板
  const loadTemplates = async () => {
    if (!isOpen) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const data = await templateService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('載入模板失敗:', err);
      setError('無法載入模板，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  // 當對話框打開時載入模板
  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // 應用模板前確認
  const handleApplyTemplate = (templateId: string) => {
    setConfirmDialog({
      isOpen: true,
      templateId
    });
  };

  // 確認應用模板
  const handleConfirmApply = async () => {
    if (!confirmDialog.templateId || !canvas) {
      setConfirmDialog({ isOpen: false, templateId: null });
      return;
    }

    try {
      const template = await templateService.getTemplate(confirmDialog.templateId);
      if (template) {
        applyTemplate(canvas, template);
      }
    } catch (err) {
      console.error('應用模板失敗:', err);
      setError('應用模板失敗，請重試');
    } finally {
      setConfirmDialog({ isOpen: false, templateId: null });
      onClose(); // 應用後關閉對話框
    }
  };

  // 刪除模板
  const handleDeleteTemplate = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation(); // 阻止冒泡，避免觸發卡片點擊
    
    if (window.confirm('確定要刪除此模板嗎？此操作無法撤消。')) {
      try {
        await templateService.deleteTemplate(templateId);
        await loadTemplates(); // 重新載入模板列表
      } catch (err) {
        console.error('刪除模板失敗:', err);
        setError('刪除模板失敗，請重試');
      }
    }
  };

  // 取消確認對話框的處理函數
  const handleCancelConfirm = () => {
    setConfirmDialog({ isOpen: false, templateId: null });
  };

  return (
    <>
      <Dialog isOpen={isOpen} onClose={onClose} title="模板庫" width="800px">
        <div>
          {error && (
            <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>
              {error}
            </div>
          )}
          
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>載入中...</div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>暫無模板</p>
              <p>點擊「儲存模板」按鈕創建您的第一個模板</p>
            </div>
          ) : (
            <div className="template-grid">
              {templates.map((template) => (
                <div 
                  key={template.id} 
                  className="template-card"
                  onClick={() => handleApplyTemplate(template.id)}
                >
                  <img 
                    src={template.thumbnail || 'placeholder.png'} 
                    alt={template.name}
                    className="template-thumbnail"
                  />
                  <div className="template-info">
                    <h4 className="template-name">{template.name}</h4>
                    <p className="template-date">{formatTemplateDate(template.createdAt)}</p>
                    
                    <div className="template-actions">
                      <button 
                        onClick={(e) => handleDeleteTemplate(e, template.id)}
                        style={{ 
                          background: 'transparent', 
                          color: '#f44336',
                          padding: '4px 8px',
                          fontSize: '12px'
                        }}
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>
      
      <Dialog 
        isOpen={confirmDialog.isOpen} 
        onClose={handleCancelConfirm}
        title="確認替換"
        width="400px"
      >
        <p>應用模板會清除當前畫布上的所有內容。確定要繼續嗎？</p>
        <div className="form-actions">
          <button onClick={handleCancelConfirm}>
            取消
          </button>
          <button 
            onClick={handleConfirmApply}
            style={{ background: '#f44336', color: 'white' }}
          >
            確定替換
          </button>
        </div>
      </Dialog>
    </>
  );
};

export default TemplateGalleryDialog; 