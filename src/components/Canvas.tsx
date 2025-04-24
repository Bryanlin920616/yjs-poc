import { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric'; // v5

type Tool = 'select' | 'text' | 'draw' | 'image';

const Canvas = () => {

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const activeToolRef = useRef<Tool>(activeTool);
  const [error, setError] = useState<string | null>(null);
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF'];
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);
  };
  
  const handleColorClick = (color: string) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = color;
    }
    if (activeTool === 'text') {
      canvas.getActiveObjects().forEach((obj: any) => {
        if (obj.type === 'i-text') {
          obj.set('fill', color);
          canvas.renderAll();
        }
      });
    }
  };

  const handleBrushSize = (size: string) => {
    const canvas = fabricRef.current;
    if (canvas?.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = Number(size);
    }
  };

  // 將 handleImageUpload 移到 useEffect 外部
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    
    const canvas = fabricRef.current; // 從 Ref 獲取 canvas
    if (!canvas) return;

    const reader = new FileReader();
    reader.onload = (f) => { // 設定reader的onload事件
      const data = f.target?.result as string;
      fabric.Image.fromURL(data, (img) => {
        const scale = Math.min(150 / img.width!, 150 / img.height!); 
        img.set({
          left: 100,
          top: 100,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          evented: true
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
      });
    };
    reader.readAsDataURL(file); // 讀取檔案，完成後會觸發onload事件
    input.value = ''; // 清空input的值，以允許下次選取一樣的檔案仍可觸發onChange事件
  };

  // 觸發檔案上傳對話框
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  // 主要的初始化邏輯
  useEffect(() => {
    if (!canvasRef.current) {
      console.log("Canvas ref not available yet.");
      return;
    }
    if (fabricRef.current) {
      console.log("Fabric instance already exists, skipping initialization.");
      return;
    }

    let canvasInstance: fabric.Canvas | null = null;

    // 處理物件刪除函數
    const handleDeleteKey = (event: KeyboardEvent) => {
      const canvas = fabricRef.current;
      if (!canvas || !canvas.getActiveObject()) {
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeObjects = canvas.getActiveObjects();
        if (activeObjects.length > 0) {
          activeObjects.forEach(obj => canvas.remove(obj));
          canvas.discardActiveObject();
          canvas.renderAll();
        }
      }
    };

    try {
      console.log("Initializing Fabric Canvas (v5)...", canvasRef.current);
      canvasInstance = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#ffffff',
        isDrawingMode: false,
        selection: true,
      });
      
      fabricRef.current = canvasInstance;
      console.log("Fabric Canvas Initialized Successfully.");

      canvasInstance.freeDrawingBrush = new fabric.PencilBrush(canvasInstance);
      canvasInstance.freeDrawingBrush.color = colors[0];
      canvasInstance.freeDrawingBrush.width = 5;
      
      // 文字工具的 mouseDown 處理
      const handleMouseDown = (options: fabric.IEvent) => {
        const currentCanvas = fabricRef.current;
        if (!currentCanvas || activeToolRef.current !== 'text') return;
        const pointer = currentCanvas.getPointer(options.e);
        const text = new fabric.IText('點擊編輯文字', {
          left: pointer.x,
          top: pointer.y,
          fontSize: 20,
          fill: '#000000',
          selectable: true,
          editable: true,
        });
        currentCanvas.add(text);
        currentCanvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
      };
      canvasInstance.on('mouse:down', handleMouseDown);
      (canvasInstance as any).__mouseDownHandler = handleMouseDown;

      // 綁定刪除鍵事件監聽
      window.addEventListener('keydown', handleDeleteKey);
      
      // 清理函數綁定到 window
      const handleClearInternal = () => {
        if (!fabricRef.current) return;
        fabricRef.current.clear();
        fabricRef.current.backgroundColor = '#ffffff';
        fabricRef.current.renderAll();
      };
      (window as any).handleClearInternal = handleClearInternal;


    } catch (initError) {
      console.error("CRITICAL: Error during initialization:", initError);
      setError("畫布初始化失敗，請刷新頁面。");
      if (canvasInstance) canvasInstance.dispose();
      fabricRef.current = null;
      return; 
    }
   
    return () => {
      console.log("Running cleanup...");
      const currentCanvas = fabricRef.current;
      if (currentCanvas) {
        console.log("Disposing Fabric instance...");
        try {
          // 移除所有事件監聽器
          const handler = (currentCanvas as any).__mouseDownHandler;
          if (handler) {
              currentCanvas.off('mouse:down', handler);
          }
          currentCanvas.dispose();
          // 移除刪除鍵事件監聽
          window.removeEventListener('keydown', handleDeleteKey);
          // 清理暴露在 window 上的函數
          delete (window as any).handleClearInternal;
        } catch (disposeError) {
          console.error("Error during canvas disposal:", disposeError);
        }
        fabricRef.current = null;
        console.log("Fabric instance disposed.");
      }
      console.log("Cleanup finished.");
    };
  }, []); // 添加空依賴陣列，確保useEffect只執行一次

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    console.log("Switching active tool to:", activeTool);
    
    switch (activeTool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
        // 恢復 forEach 循環
        canvas.getObjects().forEach((obj: fabric.Object) => { 
          obj.selectable = true; 
          obj.evented = true; 
        });
        break;
      case 'draw':
        canvas.isDrawingMode = true;
        canvas.selection = false;
        break;
      case 'text':
        canvas.isDrawingMode = false;
        canvas.selection = false;
        break;
    }
    
    canvas.renderAll();
  }, [activeTool]);

  if (error) {
    return <div style={{ color: 'red' }}>錯誤: {error}</div>;
  }

  return (
    <div className="canvas-editor">
      <div className="drawing-toolbar">
        <button 
          className={`tool-btn ${activeTool === 'select' ? 'active' : ''}`}
          onClick={() => handleToolClick('select')}
        >
          選取
        </button>
        <button 
          className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          onClick={() => handleToolClick('text')}
        >
          文字
        </button>
        <button 
          className={`tool-btn ${activeTool === 'draw' ? 'active' : ''}`}
          onClick={() => handleToolClick('draw')}
        >
          畫筆
        </button>
        {colors.map((color) => (
          <button
            key={color}
            className="color-btn"
            style={{ backgroundColor: color }}
            onClick={() => handleColorClick(color)}
          />
        ))}
        <input
          type="range"
          className="size-slider"
          min="1"
          max="20"
          defaultValue="5"
          onChange={(e) => handleBrushSize(e.target.value)}
        />
        <button 
          className="tool-btn"
          onClick={() => (window as any).handleClearInternal?.()}
        >
          清除
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
        <button 
          className="tool-btn"
          onClick={triggerImageUpload}
        >
          上傳圖片
        </button>
      </div>
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          width={800}
          height={600}
        />
      </div>
    </div>
  );
};

export default Canvas;
