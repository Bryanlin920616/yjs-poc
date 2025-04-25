import React, { ReactNode } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

/**
 * 通用對話框組件
 */
const Dialog: React.FC<DialogProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  width = '500px'
}) => {
  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div 
        className="dialog-content" 
        style={{ width }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="dialog-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog; 