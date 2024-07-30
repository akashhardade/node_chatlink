const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const authRoutes = require('./routes/auth');
const jwt =  require("jsonwebtoken");
const fs = require('fs');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use('/api/auth', authRoutes);
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


function loadChatMessages(roomId) {
  const chatFilePath = path.join('./chatRooms', `${roomId}.json`);
  if (fs.existsSync(chatFilePath)) {
    const data = fs.readFileSync(chatFilePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
}

function saveChatMessage(roomId, message) {
  const chatFilePath = path.join('./chatRooms', `${roomId}.json`);
  const messages = loadChatMessages(roomId);
  messages.push(message);
  fs.writeFileSync(chatFilePath, JSON.stringify(messages, null, 2), 'utf8');
}

// WebSocket setup
io.use((socket, next) => {
  console.log('inside connected');
  const token = socket.handshake.headers.authorization;
  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    socket.user = decoded;
    next();
  } catch (err) {
    console.log(err.message);
    next(new Error('Authentication error'));
  }
});


io.on('connection', (socket) => {
  try {
    console.log('New client connected');

    socket.on('joinRoom', ( roomId,username ) => {
      socket.join(roomId);
      socket.user = username;
      socket.roomId = roomId;
  
      const messages = loadChatMessages(roomId);
      socket.emit('previousMessages', messages);
  
      // console.log(`${username} joined room ${roomId}`);
      // io.to(roomId).emit('message', messages);
    });
  
    socket.on('sendMessage', (message,roomId, callback) => {
      const { user } = socket;
      const chatMessage = { user: user.userId, text: message, timestamp: new Date().toISOString() };
      io.to(roomId).emit('message', chatMessage);
      saveChatMessage(roomId, chatMessage);
      callback;
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      const { username, roomId } = socket;
      if (username && roomId) {
        io.to(roomId).emit('message', { user: 'system', text: `${username} has left the chat` });
      }
    });
  } catch (error) {
    console.log(error);
  }
});