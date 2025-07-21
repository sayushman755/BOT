import React, { useState } from 'react';
import axios from 'axios';
import './styles/app.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [chat, setChat] = useState([]);
  const [pdfText, setPdfText] = useState('');

  const handlePrompt = async () => {
    const form = new FormData();
    form.append('prompt', prompt);
    const res = await axios.post('http://localhost:8000/chat/', form);
    setChat([...chat, { user: prompt, bot: res.data.response }]);
    setPrompt('');
  };

  const handlePDF = async (e) => {
    const form = new FormData();
    form.append('file', e.target.files[0]);
    const res = await axios.post('http://localhost:8000/upload_pdf/', form);
    setPdfText(res.data.text);
  };

  return (
    <div className="App">
      <h2>GenAI Chatbot</h2>
      <input type="file" onChange={handlePDF} />
      <textarea value={pdfText} readOnly placeholder="PDF text will appear here" />
      <div className="chat-box">
        {chat.map((c, i) => (
          <div key={i}><b>You:</b> {c.user}<br/><b>Bot:</b> {c.bot}</div>
        ))}
      </div>
      <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask something..." />
      <button onClick={handlePrompt}>Send</button>
      <button onClick={() => setChat([])}>Reset</button>
    </div>
  );
}

export default App;
