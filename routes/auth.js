const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { signUpSchema, signInSchema } = require('../validators/auth');

const router = express.Router();

const usersFilePath = './users.json';

// Helper function to read users from file
const readUsersFromFile = () => {
  if (fs.existsSync(usersFilePath)) {
    const data = fs.readFileSync(usersFilePath);
    return JSON.parse(data);
  }
  return [];
};

// Helper function to write users to file
const writeUsersToFile = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Sign-Up Route
router.post('/signup', async (req, res) => {
  try {
    await signUpSchema.validateAsync(req.body);
    const { username, email, mobile, password } = req.body;

    const users = readUsersFromFile();
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    users.push({ userId, username, email, mobile, password: hashedPassword, rooms: [] });
    writeUsersToFile(users);

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(400).json({ message: error.details[0].message });
  }
});

// Sign-In Route
router.post('/signin', async (req, res) => {
  try {
    await signInSchema.validateAsync(req.body);
    const {username, email, mobile, password } = req.body;
    console.log(req.body);
    const users = readUsersFromFile();
    const user = users.find(user => user.username === username ||user.email === email || user.mobile === mobile );
    if (!user) {
      return res.status(400).json({ message: 'Invalid username/email/mobile or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid username/email/mobile or password' });
    }

    const token = jwt.sign({userId:user.userId, email: user.email, mobile: user.mobile }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ message: 'Signed in successfully', token, rooms: user.rooms });
  } catch (error) {
    res.status(400).json({ message: error.details[0].message });
  }
});

// Create a new chat room
router.post('/create-room', (req, res) => {
  const { token, roomName } = req.body;
  if (!token || !roomName) {
    return res.status(400).json({ message: 'Token and room name are required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const users = readUsersFromFile();
    console.log(decoded.userId);
    const user = users.find(user => user.userId === decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const roomId = uuidv4();
    const newRoom = { roomId, roomName, members: [user.username] };
    user.rooms.push(newRoom);
    writeUsersToFile(users);

    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

// Add user to a chat room
router.post('/add-user-to-room', (req, res) => {
  const { token, roomId, usernameToAdd } = req.body;
  if (!token || !roomId || !usernameToAdd) {
    return res.status(400).json({ message: 'Token, room ID, and username are required' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    const users = readUsersFromFile();
    const user = users.find(user => user.userId === decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const room = user.rooms.find(room => room.roomId === roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const userToAdd = users.find(user => user.username === usernameToAdd);
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    room.members.push(usernameToAdd);
    writeUsersToFile(users);

    res.status(200).json({ message: 'User added to room successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

module.exports = router;
