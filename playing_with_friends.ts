To implement real-time collaboration functionality for multiple users on the same team using React and TypeScript, we'll need to set up a basic structure that includes a front-end React application and a simple back-end using WebSockets for real-time communication. Below is a basic implementation using React and WebSockets. 

### Frontend: (React with TypeScript)

We'll use React Hooks and Context API to manage state and facilitate collaboration.

**1. Install dependencies:**
You will need to have `react`, `react-dom`, and `typescript` in your project. You can start a new project with:
```bash
npx create-react-app collaboration-app --template typescript
cd collaboration-app
npm install
```

**2. Setup WebSocket Client:**
Create a WebSocket client to handle incoming and outgoing messages for real-time updates.

**src/contexts/CollaborationContext.tsx:**
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';

interface CollaborationContextType {
  messages: string[];
  sendMessage: (message: string) => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(
  undefined
);

export const CollaborationProvider: React.FC = ({ children }) => {
  const [messages, setMessages] = useState<string[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Setup WebSocket connection
    const socket = new WebSocket('ws://localhost:8080');
    setWs(socket);
    
    socket.onmessage = (event) => {
      // Update messages when a new message is received
      setMessages((prevMessages) => [...prevMessages, event.data]);
    };

    return () => {
      // Clean up WebSocket connection on unmount
      socket.close();
    };
  }, []);

  const sendMessage = (message: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  };

  return (
    <CollaborationContext.Provider value={{ messages, sendMessage }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};
```

**3. Create Collaboration Component:**
This component allows users to send messages to the shared space.

**src/components/CollaborationComponent.tsx:**
```typescript
import React, { useState } from 'react';
import { useCollaboration } from '../contexts/CollaborationContext';

const CollaborationComponent: React.FC = () => {
  const { messages, sendMessage } = useCollaboration();
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim() !== '') {
      sendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div>
      <h1>Collaboration Space</h1>
      <div>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
      <div>
        <h2>Messages:</h2>
        <ul>
          {messages.map((message, index) => (
            <li key={index}>{message}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CollaborationComponent;
```

**4. App Component:**
Wrap your application with the `CollaborationProvider`.

**src/App.tsx:**
```typescript
import React from 'react';
import './App.css';
import CollaborationComponent from './components/CollaborationComponent';
import { CollaborationProvider } from './contexts/CollaborationContext';

const App: React.FC = () => {
  return (
    <CollaborationProvider>
      <div className="App">
        <CollaborationComponent />
      </div>
    </CollaborationProvider>
  );
};

export default App;
```

### Backend: (Node.js with WebSocket)

Create a simple WebSocket server to facilitate real-time communication.

**1. Install dependencies:**

```bash
npm init -y
npm install ws
```

**2. WebSocket Server:**

**server.js:**
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

console.log('WebSocket server started on ws://localhost:8080');
```

**3. Run the server:**
```bash
node server.js
```

### Running the Application

1. Start the WebSocket server by running `node server.js`.
2. Run the React application using `npm start` in your `collaboration-app` directory.
3. Open multiple browser tabs to test real-time message sending and receiving.

This setup uses a simple message-based collaboration approach through WebSockets. In a production environment, you'd likely need more robust features like authentication, authorization, message persistence, and conflict-resolution strategies for complex concurrent editing tasks.