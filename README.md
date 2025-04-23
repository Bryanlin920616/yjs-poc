# Yjs Collaborative Drawing Proof of Concept

This project is a real-time collaborative drawing Proof of Concept (POC) application built using [Yjs](https://github.com/yjs/yjs), [React](https://react.dev/), [Vite](https://vitejs.dev/), and [Fabric.js](http://fabricjs.com/).

## Features

*   **Real-time Collaborative Drawing**: Multiple users can connect to the same room (`canvas-demo`) and draw simultaneously on a shared canvas.
*   **WebSocket Synchronization**: Uses Yjs and `y-websocket` to synchronize drawing actions in real-time via WebSockets.

## Tech Stack

*   Frontend Framework: React 19
*   Build Tool: Vite
*   Collaboration: Yjs, y-websocket
*   Canvas Library: Fabric.js
*   Language: TypeScript

## Setup & Running

**1. Install Dependencies:**

```bash
npm install
```

**2. Set up WebSocket Server:**

This project requires a Yjs WebSocket server for synchronization. You can run the `y-websocket` server using `npx`.

*   Start the server, binding it to a specific IP address and port accessible on your local network:
    ```bash
    HOST=192.168.1.135 PORT=1234 npx y-websocket
    ```
    Replace `192.168.1.135` with the actual local IP address of the machine running the WebSocket server. This makes the server accessible to other devices on the same network.

**Note:** The WebSocket URL is currently hardcoded in the frontend application as `ws://192.168.1.135:1234` (`src/App.tsx`). Ensure the `HOST` IP address used in the command above matches the IP address in the frontend code and is reachable from the client devices on your network. The `PORT` should also match.

**3. Run Development Server:**

Run the Vite development server with the `--host` flag to make it accessible on your local network:

```bash
npm run dev -- --host
```

Vite will output the network URL (e.g., `http://192.168.1.XXX:5173`). Use this URL to access the application from other devices on the same network.

**4. Open Multiple Browser Windows/Devices:**

Open the network URL provided by Vite in multiple browser windows or on different devices connected to the same local network. You will see their drawing actions synchronized in real-time via the WebSocket server.

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run lint`: Lints the code using ESLint.
*   `npm run preview`: Previews the production build locally.

## Known Issues

*   React StrictMode is commented out (`src/main.tsx`) due to potential compatibility issues with Fabric.js ([fabricjs/fabric.js#10136](https://github.com/fabricjs/fabric.js/issues/10136)).
