# 🩺 Medical AI Assistant (RAG + Voice Support)

A Medical AI Assistant built using **Retrieval-Augmented Generation (RAG)** with **LangChain**, **Google Gemini**, and **Pinecone Vector Database**. The chatbot retrieves relevant information from a medical PDF knowledge base and generates accurate, context-aware responses. It also supports **voice-based input** using the browser's Speech Recognition API.

---

## 🚀 Features

* 📄 PDF-based medical knowledge retrieval
* 🔍 Semantic search using embeddings
* 🧠 RAG (Retrieval-Augmented Generation)
* 🤖 Google Gemini 2.5 Flash for response generation
* 📦 Pinecone Vector Database
* ✂️ Automatic document chunking
* 🎤 Voice input using Web Speech API
* 💬 Conversational chat interface
* 📝 Query rewriting for follow-up questions
* ⚠️ Medical disclaimer for responsible AI usage

---

## 🛠️ Tech Stack

### Frontend

* React (Vite)
* Axios
* Tailwind CSS

### Backend

* Node.js
* Express.js
* LangChain

### AI & Vector Database

* Google Gemini 2.5 Flash
* Google Generative AI Embeddings
* Pinecone

---

## 📂 Project Structure

```text
Medical-AI-Assistant/
│
├── backend/
│   ├── index.js        # PDF indexing
│   ├── query.js        # RAG pipeline
│   ├── server.js       # Express server
│   ├── medical.pdf
│   └── .env
│
└── frontend/
    ├── src/
    ├── public/
    └── App.jsx
```

---

## ⚙️ How It Works

1. Load the medical PDF.
2. Split the document into smaller chunks.
3. Generate embeddings using Google's embedding model.
4. Store embeddings in Pinecone.
5. Convert the user's question into an embedding.
6. Retrieve the most relevant chunks.
7. Send the retrieved context to Gemini.
8. Generate an accurate response based on the retrieved context.

---

## 🎤 Voice Assistant

Users can ask medical questions using their microphone.
Workflow:
Voice → Speech Recognition → Text → RAG Pipeline → Gemini → Response

## ▶️ Run Locally

### Backend

```bash
cd backend
npm install
npm run index
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 📌 Future Improvements

* User authentication
* Session-based chat history
* Streaming responses
* Text-to-Speech (AI voice responses)
* Multiple medical documents
* Conversation memory per user

---

## ⚠️ Disclaimer

This application is developed for educational purposes only. It is not intended to diagnose, treat, cure, or prevent any disease. Users should always consult a qualified healthcare professional for medical advice.

---

## 👨‍💻 Author

**Satyam Sharma**

* B.Tech (Computer Science)
* Full Stack Developer
* Generative AI Enthusiast
