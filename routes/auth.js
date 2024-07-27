const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
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
    const existingUser = users.find(user => user.email === email || user.mobile === mobile);
    if (existingUser) {
      return res.status(400).json({ message: 'Email or mobile number already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, email, mobile, password: hashedPassword });
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

    const users = readUsersFromFile();
    const user = users.find(user => user.username === username ||user.email === email || user.mobile === mobile );
    if (!user) {
      return res.status(400).json({ message: 'Invalid username/email/mobile or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid username/email/mobile or password' });
    }

    const token = jwt.sign({ email: user.email, mobile: user.mobile }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ message: 'Signed in successfully', token });
  } catch (error) {
    res.status(400).json({ message: error.details[0].message });
  }
});

module.exports = router;
