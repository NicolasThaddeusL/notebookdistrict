# 📘 Notebook District
A lightweight online school-supplies storefront with product filtering, modals, and a minimal backend API.

Notebook District is built with pure **HTML, CSS, and JavaScript (frontend)** and a simple **Node.js + Express backend**.  
This setup is optimized to work on free hosting (Netlify + Render).

---

## 📂 Project Structure
notebookdistrict/
│
├── frontend/
│ ├── css/
│ ├── data/
│ ├── html/
│ └── js/
│
└── backend/
├── server.js
├── users.json
├── package.json
└── package-lock.json


---

## 🚀 Deployment Guide

### **Frontend → Netlify (Free)**
1. Go to https://netlify.com  
2. Create a site → import from GitHub  
3. Set **Publish directory:**

### **Backend → Render (Free)**
1. Go to https://render.com  
2. Create **Web Service**  
3. Set **Root Directory:**
4. **Start Command:**

Render will generate a URL like:
https://notebookdistrict-backend.onrender.com


---

## 🔌 Connecting Frontend → Backend

Use your Render backend URL inside frontend JS:

```js
fetch('https://your-backend-url.onrender.com/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
