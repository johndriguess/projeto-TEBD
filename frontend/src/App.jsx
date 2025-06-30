import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/>
  </svg>
);


function App() {
  const [apiKey, setApiKey] = useState('');
  const [file, setFile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentQuery, setCurrentQuery] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);


  const handleUpload = async () => {
    if (!file || !apiKey) {
      alert("Por favor, forneça a chave de API e selecione um arquivo PDF.");
      return;
    }
    
    setIsLoading(true);
    setIsReady(false);
    setMessages([{role: 'assistant', content: "Analisando seu documento... Por favor, aguarde."}]);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', apiKey);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessages([{role: 'assistant', content: "Documento pronto! Pode fazer suas perguntas."}]);
      setIsReady(true);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessages([{role: 'assistant', content: `Erro no upload: ${errorMessage}`}]);
      setIsReady(false);
    } finally {
      setIsLoading(false);
    }
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!currentQuery.trim() || !isReady) return;

    const userMessage = { role: 'user', content: currentQuery };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentQuery('');

    try {
      const response = await axios.post('http://127.0.0.1:5000/ask', {
        question: currentQuery,
      });
      const assistantMessage = { role: 'assistant', content: response.data.answer };
      setMessages(prev => [...prev, userMessage, assistantMessage]);
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      const assistantErrorMessage = { role: 'assistant', content: `Erro ao buscar resposta: ${errorMessage}` };
      setMessages(prev => [...prev, userMessage, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="header">
        <h2>Converse com seu PDF</h2>
      </div>
      
      <div className="setup-section">
        <input
          type="password"
          placeholder="Cole sua Chave de API do Google AI aqui"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button onClick={handleUpload} disabled={isLoading || !file || !apiKey}>
          {isLoading && !isReady ? 'Processando...' : 'Fazer Upload e Processar'}
        </button>
      </div>

      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message-container ${msg.role}`}>
            <div className="avatar">
              {msg.role === 'user' ? 'V' : <GeminiIcon />}
            </div>
            <div className="message">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && isReady && 
          <div className="message-container assistant">
            <div className="avatar"><GeminiIcon /></div>
            <div className="message">Pensando...</div>
          </div>
        }
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Faça sua pergunta..."
          value={currentQuery}
          onChange={(e) => setCurrentQuery(e.target.value)}
          disabled={!isReady || isLoading}
        />
        <button type="submit" disabled={!isReady || isLoading}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

export default App;