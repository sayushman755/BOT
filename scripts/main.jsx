const { useState, useEffect, useRef } = React;

const App = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your AI assistant. You can ask me questions or upload a PDF to chat about its content.", sender: "ai" }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfText, setPdfText] = useState("");
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js`;
  }, []);

  const handleSendMessage = async () => {
    if (userInput.trim() === "" || isLoading) return;

    const newUserMessage = { text: userInput, sender: "user" };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsLoading(true);
    setError(null);

    try {
      const prompt = pdfText
        ? `Based on the following content from a PDF, please answer the user's question.\n\n---\nPDF Content:\n${pdfText}\n---\n\nUser Question: ${userInput}`
        : userInput;

      await fetchAIResponse(prompt);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to get a response. Please check your connection and API key.");
      setMessages(prev => [...prev, { text: "Sorry, I couldn't get a response.", sender: "ai" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAIResponse = async (prompt) => {
    const apiKey = "dewwedewfwevfwefwf"; // Replace this with your Gemini API Key
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }]
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "API request failed");
    }

    const result = await response.json();

    let aiText = "Sorry, I could not process that request.";
    if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
      aiText = result.candidates[0].content.parts[0].text;
    }

    setMessages(prev => [...prev, { text: aiText, sender: "ai" }]);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file || file.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setMessages(prev => [...prev, { text: `Processing PDF: ${file.name}...`, sender: "system" }]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const typedarray = new Uint8Array(e.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          fullText += textContent.items.map(item => item.str).join(" ") + "\n";
        }
        setPdfText(fullText);
        setMessages(prev => [...prev, { text: `PDF "${file.name}" is ready. Ask me anything about it!`, sender: "system" }]);
      } catch (err) {
        console.error("Error processing PDF:", err);
        setError("Failed to read the PDF file.");
        setMessages(prev => [...prev, { text: `Error reading PDF. Please try another file.`, sender: "system" }]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = null;
  };

  const handleResetChat = () => {
    setMessages([
      { text: "Hello! I'm your AI assistant. How can I help you today?", sender: "ai" }
    ]);
    setUserInput("");
    setPdfText("");
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const Message = ({ msg }) => {
    const isUser = msg.sender === 'user';
    const isSystem = msg.sender === 'system';

    if (isSystem) {
      return (
        <div className="text-center my-2">
          <span className="text-xs text-gray-400 bg-gray-700 px-3 py-1 rounded-full">{msg.text}</span>
        </div>
      );
    }

    return (
      <div className={`flex items-end gap-2 my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
        {!isUser && (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            🤖
          </div>
        )}
        <div
          className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${isUser ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}
          dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <header className="text-center mb-4">
        <h1 className="text-3xl font-bold text-gray-100">AI Chatbot</h1>
        <p className="text-sm text-gray-400">Powered by Gemini & React</p>
      </header>

      <main className="flex-1 overflow-y-auto bg-gray-800 p-4 rounded-2xl shadow-inner">
        {messages.map((msg, index) => <Message key={index} msg={msg} />)}
        {isLoading && (
          <div className="flex justify-start gap-2 my-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">🤖</div>
            <div className="bg-gray-700 px-4 py-3 rounded-2xl rounded-bl-none flex items-center">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        {error && <div className="text-red-400 text-center my-2">{error}</div>}
        <div ref={chatEndRef} />
      </main>

      <footer className="mt-4">
        <div className="flex items-center bg-gray-800 p-2 rounded-2xl">
          <input
            type="text"
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-400 p-2"
            placeholder="Type your message or upload a PDF..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            disabled={isLoading}
          />
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            disabled={isLoading}
          />
          <button
            title="Upload PDF"
            onClick={() => fileInputRef.current.click()}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
          >
            📄
          </button>
          <button
            title="Reset Chat"
            onClick={handleResetChat}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full"
          >
            🔄
          </button>
          <button
            onClick={handleSendMessage}
            disabled={isLoading || userInput.trim() === ""}
            className="p-2 bg-blue-600 text-white rounded-full disabled:bg-blue-900 hover:bg-blue-500"
          >
            ➤
          </button>
        </div>
      </footer>
    </div>
  );
};

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(<App />);
