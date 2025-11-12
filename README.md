# 🧠 PLLama – AI-Powered Forensic Assistant

An AI-powered platform that integrates **LLMs (LLaMA)** and **Computer Vision (YOLOv8)** to assist in forensic and agricultural scene analysis.
It combines **three main components**:

1. 🧩 **FastAPI (Python)** – YOLOv8 image detection service
2. ⚙️ **Express.js + MongoDB** – chat management and authentication
3. 💬 **React (Vite)** – interactive chatbot interface

---

## 🚀 Tech Stack

| Layer      | Framework            | Description                                             |
| ---------- | -------------------- | ------------------------------------------------------- |
| Frontend   | React (Vite)         | Chatbot UI with integrated file uploads                 |
| API Server | Express.js + MongoDB | Handles chat storage, authentication, and model routing |
| AI Service | FastAPI + YOLOv8     | Detects and labels objects in uploaded images           |
| Database   | MongoDB Atlas        | Stores all chat history (text + YOLO detections)        |

---

## 🧩 Project Structure

```
PLLAMA/
│
├── backend/
│   ├── main.py               # FastAPI YOLO backend
│   ├── server.js             # Express.js + MongoDB backend
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chatRoutes.js
│   │   ├── historyRoutes.js
│   │   ├── model.js
│   │   ├── users.js
│   ├── models/
│   │   ├── Conversation.js
│   │   ├── User.js
│   ├── src/
│   │   ├── yolo_model/
│   │   │   ├── weights/best.pt
│   │   │   ├── data/data_english.yaml
│   │   ├── uploads/
│   │   ├── results/
│   ├── venv/ (ignored)
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chatbot.js
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   ├── utils/
│   │   │   ├── queryModel.js
│   ├── package.json
│
├── .gitignore
├── README.md
```

---

## 🧠 Setup Guide

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/<your-username>/PLLAMA.git
cd PLLAMA
```

---

### 2️⃣ Setup Backend (Node.js + MongoDB)

**Navigate to backend folder:**

```bash
cd backend
```

**Install dependencies:**

```bash
npm install
```

**Create `.env` file:**

```bash
touch .env
```

**Add these environment variables:**

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
ALLOWED_ORIGIN=http://localhost:3000
PORT=5000
```

**Start the Node.js server:**

```bash
npm run dev
```

✅ Server will run on:

```
http://localhost:5000
```

You should see:

```
✅ MongoDB connected
🚀 Server running on port 5000
```

---

### 3️⃣ Setup YOLO API (FastAPI)

**Activate Python environment:**

```bash
cd backend
python -m venv venv
venv\Scripts\activate    # (Windows)
pip install "fastapi[all]"
pip install ultralytics
# OR
source venv/bin/activate # (Mac/Linux)
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

If you don’t have a `requirements.txt` yet, create it with:

```bash
pip freeze > requirements.txt
```

**Run FastAPI YOLO backend:**

```bash
uvicorn main:app --reload
```

✅ API runs at:

```
http://127.0.0.1:8000
```

---

### 4️⃣ Setup Frontend (React)

**Open new terminal:**

```bash
cd frontend
```

**Install dependencies:**

```bash
npm install
```

**Run development server:**

```bash
npm run dev
```

✅ App runs at:

```
http://localhost:3000
```

---

## 🔄 Testing Integration

When everything is running:

* Frontend → `http://localhost:3000`
* Express API → `http://localhost:5000`
* YOLO FastAPI → `http://127.0.0.1:8000`

🧠 Try uploading an image via the chatbot “➕” button.
You should see:

* The uploaded image preview
* YOLO detection text (`coffee_rust (91.2%)`)
* Annotated result image

All messages (text + images) will persist in MongoDB even after refresh ✅

---

## 🧾 Common Commands Summary

| Task                   | Command                                            |
| ---------------------- | -------------------------------------------------- |
| Run frontend           | `npm run dev` (inside `frontend/`)                 |
| Run backend server     | `npm run dev` (inside `backend/`)                  |
| Start YOLO API         | `uvicorn main:app --reload`                        |
| Create Python env      | `python -m venv venv`                              |
| Activate env (Windows) | `venv\Scripts\activate`                            |
| Install backend deps   | `npm install`                                      |
| Install Python deps    | `pip install -r requirements.txt`                  |
| Add dependencies       | `npm install <package>` or `pip install <package>` |

---

## 🧠 Developer Notes

* YOLOv8 model path: `backend/src/yolo_model/weights/best.pt`
* Annotated images stored in: `backend/src/results/`
* Uploads temporarily stored in: `backend/src/uploads/`
* MongoDB collection: `conversations`
* Environment variables are **never committed** (`.env` is ignored)
* Make sure both servers (Express + FastAPI) are running together for full functionality.

---

## 🧰 Troubleshooting

| Issue                             | Possible Fix                                      |
| --------------------------------- | ------------------------------------------------- |
| `{"detail":"Method Not Allowed"}` | Check if you are using `POST` to `/predict`       |
| YOLO output not in English        | Ensure `data_english.yaml` is loaded in `main.py` |
| Chat not saving                   | Check MongoDB connection string & `.env`          |
| Images not showing                | Verify CORS settings in FastAPI `main.py`         |

---

## 👥 Team Guidelines

* Always pull latest changes before working:

  ```bash
  git pull origin main
  ```
* Use feature branches:

  ```bash
  git checkout -b feature/yolo-improvements
  ```
* After testing, commit & push:

  ```bash
  git add .
  git commit -m "Added YOLO persistence"
  git push origin feature/yolo-improvements
  ```
* Create a Pull Request for review.

---

## 🏁 Final Note

You’ve built a **cross-framework AI system** — React + Node + FastAPI + YOLO + MongoDB — all working seamlessly.
Keep your `.env` private and your weights folder lightweight before pushing to GitHub.

✨ *Built by Tripura and team — PLLama Project* 🧠💻
