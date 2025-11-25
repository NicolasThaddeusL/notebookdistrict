// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();

// Render will inject PORT automatically
const PORT = process.env.PORT || 3000;

app.use(cors());            // Allow frontend → backend
app.use(express.json());

// ====== FRONTEND STATIC FILES (optional, for local dev) ======
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// Home page → main.html (LOCAL ONLY, not for Netlify)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'main.html'));
});

app.get('/about-us', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'about-us.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'shop.html'));
});

// ====== USERS JSON "DB" ======
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
      message: 'Username and password required'
    });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);

  if (user) {
    if (user.password === password) {
      return res.json({
        ok: true,
        mode: 'login',
        message: 'Welcome back!',
        username: user.username
      });
    } else {
      return res.status(401).json({
        ok: false,
        message: 'Incorrect password for this username.'
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
    username
  });
});

// ====== START SERVER ======
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
