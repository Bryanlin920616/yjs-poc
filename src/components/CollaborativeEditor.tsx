import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { QuillBinding } from 'y-quill';
import Quill from 'quill';
import QuillCursors from 'quill-cursors';
import 'quill/dist/quill.snow.css';

Quill.register('modules/cursors', QuillCursors);

interface CollaborativeEditorProps {
  roomName: string;
  websocketUrl?: string;
}

const CollaborativeEditor = ({ 
  roomName, 
  websocketUrl = 'wss://demos.yjs.dev' 
}: CollaborativeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // 初始化 Quill 編輯器
    const quill = new Quill(editorRef.current, {
      modules: {
        cursors: true,
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline'],
          ['image', 'code-block']
        ],
        history: {
          userOnly: true
        }
      },
      placeholder: '開始協同編輯...',
      theme: 'snow'
    });

    quillRef.current = quill;

    // 初始化 Yjs 文檔
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText('quill');

    // 設置 WebSocket 提供者
    const provider = new WebsocketProvider(websocketUrl, roomName, ydoc);

    // 綁定 Quill 編輯器到 Yjs
    const binding = new QuillBinding(ytext, quill);

    // 清理函數
    return () => {
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomName, websocketUrl]);

  return (
    <div className="collaborative-editor">
      <div ref={editorRef} style={{ height: '400px' }} />
    </div>
  );
};

export default CollaborativeEditor; 