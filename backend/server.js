// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Render requires using process.env.PORT
const PORT = process.env.PORT || 3000;

app.use(cors());            // Allow frontend → backend requests
app.use(express.json());

// ====== FRONTEND STATIC FILES (LOCAL DEVELOPMENT ONLY) ======
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Local root → main.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'main.html'));
});

// Local pretty URLs
app.get('/about-us', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'about-us.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'shop.html'));
});

// ====== HEALTH CHECK (REQUIRED BY RENDER) ======
app.get('/healthz', (req, res) => {
  res.send('ok');
});

// ====== USERS JSON "DATABASE" ======
function getUsers() {
  const file = path.join(__dirname, 'users.json');
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveUsers(users) {
  const file = path.join(__dirname, 'users.json');
  fs.writeFileSync(file, JSON.stringify(users, null, 2));
}

// ====== AUTH ENDPOINT ======
app.post('/auth', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      ok: false,
      message: 'Username and password required',
    });
  }

  const users = getUsers();
  const user = users.find((u) => u.username === username);

  if (user) {
    // Login
    if (user.password === password) {
      return res.json({
        ok: true,
        mode: 'login',
        message: 'Welcome back!',
        username: user.username,
      });
    } else {
      return res.status(401).json({
        ok: false,
        message: 'Incorrect password for this username.',
      });
    }
  }

  // Register
  users.push({ username, password });
  saveUsers(users);

  return res.json({
    ok: true,
    mode: 'register',
    message: 'Account created. Welcome!',
    username,
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
