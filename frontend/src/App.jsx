import { useState, useRef } from "react";
import axios from "axios";
const API_URL = import.meta.env.VITE_API_URL;
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";



export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  //for voice feature
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  

  const sendMessage = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);

    setQuestion("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        question,//jb hm setQuestion(""); yha question ko empty kr de rhe h to yha to question empty jaigya na
      });

      const botMessage = {
        role: "bot",
        text: res.data.answer,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Server Error" },
      ]);
    }

    setLoading(false);
  };

  const startListening = () => {

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;//Browser ke Speech Recognition API ko access kar rahe ho.
    //Chrome me webkitSpeechRecognition hota h & Kuch browsers me SpeechRecognition
    //Agar Chrome hua, SpeechRecognition = window.webkitSpeechRecognition
    //Agar Firefox future me support kare, SpeechRecognition = window.SpeechRecognition

  if (!SpeechRecognition) {
    alert("Speech Recognition is not supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();//Yaha Speech Recognition ka object banaya.Ye object hi microphone ko control karega.

  //recognition.lang = "en-US";      // English
  recognition.lang = "en-IN";   // Ye batata hai kis language me speech recognize hogi. yha Indian English

  recognition.interimResults = false;//Speech Recognition do tarike se result de sakta h, T->Bolte bolte hi words aate rahenge.f->opposite
  recognition.continuous = false;//Continuous listening off.F->Ek baar bolo,Speech detect ho,Automatic stop.T->continuously sunta rehta. 

  recognitionRef.current = recognition;

  recognition.start();//Microphone ON. Ab browser voice sunna start karega.
  // recognition.onspeechend = () => {
  //   recognition.stop();
  // };
  setListening(true);
  
  recognition.onresult = (event) => {//Ye callback tab chalega jab user bolna complete kar de. Browser speech ko text me convert kar deta hai.
  
    const transcript = event.results[0][0].transcript;
  
    setQuestion(transcript);//Textbox me automatically ye text fill ho jayega.

    setListening(false);//Listening animation hata do.

    // automatically send after speaking

    setTimeout(() => {
      sendVoiceMessage(transcript);
    }, 500);

  };

  recognition.onerror = () => {//Agar microphone permission deny, network issue, speech detect na ho
    setListening(false);
  };

  recognition.onend = () => {//Jab microphone automatically stop ho jaye.
    setListening(false);
  };
};

 const sendVoiceMessage = async (voiceQuestion) => {

  if (!voiceQuestion.trim()) return;

  const userMessage = {
    role: "user",
    text: voiceQuestion,
  };

  setMessages((prev) => [...prev, userMessage]);

  setQuestion("");

  setLoading(true);

  try {

    const res = await axios.post(
      `${API_URL}/chat`,
      {
        question: voiceQuestion,
      }
    );

    const botMessage = {
      role: "bot",
      text: res.data.answer,
    };

    setMessages((prev) => [...prev, botMessage]);

  } catch {

    setMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: "❌ Server Error",
      },
    ]);

  }

  setLoading(false);

};

  

  return (
  <div className="min-h-screen bg-linear-to-b from-zinc-950 via-zinc-900
   to-black text-white flex flex-col items-center p-4 gap-3">

    {/* Header */}
    <div className="w-full max-w-2xl py-3  tracking-wide 
    font-bold text-sm bg-gray-300 rounded-2xl text-black">
        🩺 Medical AI Assistant
    </div>

    {/* Chat Box */}
    <div className="w-full max-w-2xl flex-1 overflow-y-auto space-y-3 p-4 
      rounded-2xl border border-zinc-800 
      bg-white/5 backdrop-blur-md shadow-lg">

      {messages.map((msg, i) => (
        <div
          key={i}
          className={`px-4 py-2 rounded-2xl text-sm leading-relaxed max-w-[60%] shadow-md ${
            msg.role === "user"
              ? "ml-auto bg-blue-600 text-white rounded-br-sm"
              : "mr-auto bg-zinc-800 text-zinc-100 rounded-bl-sm"
          }`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {msg.text}
          </ReactMarkdown>
        </div>
      ))}

      {loading && (
        <div className="text-zinc-400 text-sm animate-pulse">
          🤖 Thinking...
        </div>
      )}
      
    </div>

    {/* Input Box */}
    <div className="w-full max-w-3xl mx-auto mt-4 ">
    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-3xl px-3 py-2 shadow-lg">

    <input
      value={question}
      onChange={(e) => setQuestion(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      placeholder={
        listening
          ? "Listening..."
          : "Type your medical question..."
      }
      disabled={listening}
      className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500 px-2 text-sm"
    />

    {/* Voice Button */}
    <button
      onClick={startListening}
      disabled={loading || listening}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition 
      ${
        loading || listening
          ? "bg-gray-300 cursor-not-allowed"
          : "hover:bg-gray-300"
      }`}
    >
      {listening ? "🎙️" : "🎤"}
    </button>

    {/* Send Button */}
    <button
      onClick={sendMessage}
      disabled={loading}
      className={`w-10 h-10 flex items-center justify-center rounded-full transition
      ${
        loading
          ? "bg-blue-300 cursor-not-allowed"
          : "bg-blue-600 hover:bg-blue-800 text-white"
      }`}
    >
      ➤
    </button>

  </div>
</div>

    {/* Footer warning */}
    <p className="text-xs text-zinc-500 mt-3 text-center max-w-xl">
    ⚠️  MEDICAL DISCLAIMER:

     This chatbot provides educational and informational content only.
     It is not intended to diagnose, treat, cure, or prevent any disease.

     Users should consult a qualified healthcare professional for
     medical advice, diagnosis, or treatment.

    </p>
  </div>
);
}


