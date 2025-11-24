// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());

// ====== FRONTEND STATIC FILES ======
const frontendDir = path.join(__dirname, '..', 'frontend');

// This makes /css, /js, /data, /html, images, etc. readable
app.use(express.static(frontendDir));

// Home page  ->  main.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'main.html'));
});

// Optional: nice URLs for other pages
app.get('/about-us', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'about-us.html'));
});

app.get('/shop', (req, res) => {
  res.sendFile(path.join(frontendDir, 'html', 'shop.html'));
});

// ====== SIMPLE "DB" USING users.json ======
function getUsers() {
  const file = path.join(__dirname, 'users.json');
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveUsers(users) {
  const file = path.join(__dirname, 'users.json');
  fs.writeFileSync(file, JSON.stringify(users, null, 2));
}

// Unified login + register endpoint
app.post('/auth', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: 'Username and password required' });
  }

  const users = getUsers();
  const user = users.find(u => u.username === username);

  if (user) {
    // Username already exists -> check password
    if (user.password === password) {
      return res.json({
        ok: true,
        mode: 'login',
        message: 'Welcome back!',
        username: user.username
      });
    } else {
      return res
        .status(401)
        .json({ ok: false, message: 'Incorrect password for this username.' });
    }
  }

  // Username does not exist -> create new user
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
  console.log(`Server running at http://localhost:${PORT}`);
});
