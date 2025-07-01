import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

globalThis.globalClients = globalThis.globalClients ?? new Map();

const addClient = (userId, ws) => {
  globalThis.globalClients.set(userId, ws);
}

const removeClient = (ws) => {
  for (const [userId, socket] of globalThis.globalClients.entries()) {
    if (socket === ws) {
      globalThis.globalClients.delete(userId);
      return;
    }
  }
}

const getClient = (userId) => {
  return globalThis.globalClients.get(userId);
}

wss.on('connection', (ws) => {
  console.log('✅ WebSocket client connected');

  ws.on('close', () => {    
    console.log('❌ WebSocket client disconnected');
    removeClient(ws);
  });

  ws.on('message', (message) => {
    const data = JSON.parse(message.toString());
    if (data.type === 'auth' && data.userId) {
      addClient(data.userId, ws);
    }
  })
});

app.post('/broadcast', (req, res) => {
  const body = req.body;
  const { targets, data } = body;

  targets.forEach((target) => {
    var client = getClient(target);
    if (client && client.readyState === WebSocket.OPEN) {
      console.log('Sending data to client:', data);
      client.send(JSON.stringify(data));
    }
  })

  res.json({ status: 'sent' });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket relay running at http://localhost:${PORT}`);
});