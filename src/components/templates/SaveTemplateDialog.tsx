import React, { useState } from 'react';
import Dialog from './Dialog';
import { TemplateInput } from './types';
import { templateService } from './templateService';

interface SaveTemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  canvas: fabric.Canvas | null;
}

const SaveTemplateDialog: React.FC<SaveTemplateDialogProps> = ({ isOpen, onClose, canvas }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('請輸入模板名稱');
      return;
    }

    if (!canvas) {
      setError('畫布不可用');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      
      await templateService.saveTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        canvas
      });
      
      // 重置表單並關閉對話框
      setName('');
      setDescription('');
      onClose();
    } catch (err) {
      setError('保存模板失敗，請重試');
      console.error('保存模板錯誤:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleCancel} title="儲存為模板">
      <div className="template-form">
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '16px' }}>
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="template-name">模板名稱</label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="請輸入模板名稱"
            disabled={isSaving}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="template-description">描述 (可選)</label>
          <textarea
            id="template-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="請輸入模板描述"
            disabled={isSaving}
          />
        </div>
        
        <div className="form-actions">
          <button onClick={handleCancel} disabled={isSaving}>
            取消
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim()}
            style={{ background: '#4caf50', color: 'white' }}
          >
            {isSaving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Dialog>
  );
};

export default SaveTemplateDialog; 