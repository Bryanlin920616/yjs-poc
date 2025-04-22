import { useEffect, useRef, useState, useCallback } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { fabric } from 'fabric'; // v5

type Tool = 'select' | 'text' | 'draw';

interface CollaborativeCanvasProps {
  roomName: string;
  websocketUrl?: string;
}

const CollaborativeCanvas = ({
  roomName,
  websocketUrl = 'wss://demos.yjs.dev' 
}: CollaborativeCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('select');
  const activeToolRef = useRef<Tool>(activeTool);
  const [error, setError] = useState<string | null>(null);
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF'];

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

  const handleClear = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
  };

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
    let provider: WebsocketProvider | null = null;
    let ydoc: Y.Doc | null = null;
    let ymap: Y.Map<any> | null = null;

    const syncCanvasToYjs = () => {
      if (!canvasInstance || !ymap) {
        console.warn("Canvas instance or ymap not ready for sync.");
        return;
      }
      try {
        const canvasJSON = canvasInstance.toJSON();
        ymap.set('canvasData', canvasJSON);
        console.log("Canvas synced to Yjs");
      } catch (syncErr) {
          console.error("Error syncing canvas to Yjs:", syncErr);
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
      
      ydoc = new Y.Doc();
      ymap = ydoc.getMap('canvas');
      provider = new WebsocketProvider(websocketUrl, roomName, ydoc);

      provider.on('status', ({ status }: { status: string }) => {
        console.log('WebSocket Status:', status);
        if (status !== 'connected') {
        }
      });

      canvasInstance.on('object:modified', syncCanvasToYjs);
      canvasInstance.on('object:added', syncCanvasToYjs);
      canvasInstance.on('path:created', syncCanvasToYjs);
      canvasInstance.on('text:changed', syncCanvasToYjs);

      ymap.observe(() => {
        if (!canvasInstance || !ymap) return;
        try {
            const remoteCanvasData = ymap.get('canvasData');
            if (remoteCanvasData) {
                console.log("Received remote canvas data");
                canvasInstance.loadFromJSON(remoteCanvasData, () => {
                    canvasInstance!.renderAll();
                    console.log("Loaded remote data");
                });
            }
        } catch (loadErr) {
            console.error("Error loading remote canvas data:", loadErr);
        }
      });

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
        syncCanvasToYjs();
      };
      canvasInstance.on('mouse:down', handleMouseDown);
      (canvasInstance as any).__mouseDownHandler = handleMouseDown;

    } catch (initError) {
      console.error("CRITICAL: Error during initialization:", initError);
      setError("畫布或同步初始化失敗，請刷新頁面。");
      if (canvasInstance) canvasInstance.dispose();
      if (provider) provider.destroy();
      if (ydoc) ydoc.destroy();
      fabricRef.current = null;
      return; 
    }
   
    return () => {
      console.log("Running cleanup...");
      const currentCanvas = fabricRef.current;
      if (currentCanvas) {
        console.log("Disposing Fabric instance...");
        try {
          currentCanvas.off('object:modified', syncCanvasToYjs);
          currentCanvas.off('object:added', syncCanvasToYjs);
          currentCanvas.off('path:created', syncCanvasToYjs);
          currentCanvas.off('text:changed', syncCanvasToYjs);
          const handler = (currentCanvas as any).__mouseDownHandler;
          if (handler) {
              currentCanvas.off('mouse:down', handler);
          }
          currentCanvas.dispose();
        } catch (disposeError) {
          console.error("Error during canvas disposal:", disposeError);
        }
        fabricRef.current = null;
        console.log("Fabric instance disposed.");
      }
      if (provider) {
        console.log("Destroying Websocket provider...");
        provider.destroy();
      }
      if (ydoc) {
        console.log("Destroying Yjs document...");
        ydoc.destroy();
      }
      console.log("Cleanup finished.");
    };
  }, [roomName, websocketUrl]); 

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    console.log("Switching active tool to:", activeTool);
    switch (activeTool) {
      case 'select':
        canvas.isDrawingMode = false;
        canvas.selection = true;
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
    <div className="collaborative-canvas">
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
          onClick={handleClear}
        >
          清除
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

export default CollaborativeCanvas; 