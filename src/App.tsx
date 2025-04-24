import Canvas from './components/Canvas';
import './App.css';
import { useState } from 'react';

function App() {
  const [initialPhotos] = useState<string[]>([]);

  return (
    <div className="app">
      <h1>繪圖編輯器</h1>
      <p>使用此工具創建您的行程拼貼！</p>
      <Canvas initialPhotos={initialPhotos} />
    </div>
  );
}

export default App;
