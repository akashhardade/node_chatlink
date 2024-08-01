const express = require("express");
const bodyParser = require("body-parser");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(bodyParser.json());
app.use("/api/auth", authRoutes);
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

function loadChatMessages(roomName) {
  const chatFilePath = path.join("./rooms", `${roomName}.json`);
  if (fs.existsSync(chatFilePath)) {
    const data = fs.readFileSync(chatFilePath, "utf8");
    return JSON.parse(data);
  }
  return [];
}

// function saveChatMessage(roomId, message) {
//   const chatFilePath = path.join("./chatRooms", `${roomId}.json`);
//   const messages = loadChatMessages(roomId);
//   messages.push(message);
//   fs.writeFileSync(chatFilePath, JSON.stringify(messages, null, 2), "utf8");
// }

// WebSocket setup
// io.use((socket, next) => {
//   console.log('inside connected');
//   const token = socket.handshake.headers.authorization;
//   try {
//     const decoded = jwt.verify(token, 'your_jwt_secret');
//     socket.user = decoded;
//     next();
//   } catch (err) {
//     console.log(err.message);
//     next(new Error('Authentication error'));
//   }
// });

io.on("connection", (socket) => {
  try {
    console.log("New client connected");

    socket.on("joinRoom", (roomName, username) => {
      socket.join(roomName);
      const messages = loadChatMessages(roomName);
      socket.emit("previousMessages", messages);
    });

    socket.on("sendMessage", (roomName, username, message) => {
      // const { username, message, roomName } = socket;
      const folderPath = path.join(__dirname, "rooms");
      const filePath = path.join(folderPath, `${roomName}.json`);
      if (fs.existsSync(filePath)) {
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) return console.error(err);
          const jsonData = JSON.parse(data);
          jsonData.message.push({
            username: username,
            text: message,
            timestamp: new Date().toISOString(),
          });
          fs.writeFile(
            filePath,
            JSON.stringify(jsonData, null, 2),
            "utf8",
            (err) => {
              if (err) return console.error(err);
              console.log("File has been updated");
            }
          );
          socket.emit("status", "Successfully send");
        });
      }
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  } catch (error) {
    console.log(error);
  }
});