import CollaborativeCanvas from './components/CollaborativeCanvas';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>協同繪圖示範</h1>
      <p>此畫布與所有訪問相同房間的用戶同步。您可以一起創作！</p>
      <CollaborativeCanvas roomName="canvas-demo" websocketUrl="ws://192.168.1.135:1234" />
    </div>
  );
}

export default App;
