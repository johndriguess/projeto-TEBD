import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/>
  </svg>
);

const BotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM8.5 12.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.5-5.5c-.83 0-1.5-.67-1.5-1.5S11.17 4 12 4s1.5.67 1.5 1.5S12.83 7 12 7zm3.5 5.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm3.5 2.5h-7c-.28 0-.5.22-.5.5s.22.5.5.5h7c.28 0 .5-.22.5-.5s-.22-.5-.5-.5z"/>
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
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
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-md p-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Converse com seu PDF</h2>
      </header>
      
      <div className="p-4 space-y-4 bg-white border-b-2 border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="password"
              placeholder="Cole sua Chave de API do Google AI aqui"
              className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <input
              type="file"
              accept=".pdf"
              className="flex-grow p-2 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={(e) => setFile(e.target.files[0])}
            />
        </div>
        <button 
            onClick={handleUpload} 
            disabled={isLoading || !file || !apiKey}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
        >
          {isLoading && !isReady ? 'Processando...' : 'Fazer Upload e Processar'}
        </button>
      </div>

      <main ref={chatWindowRef} className="flex-grow p-6 overflow-y-auto space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                    <BotIcon />
                </div>
             )}
            <div className={`max-w-lg p-4 rounded-2xl shadow ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
              <p className="text-sm">{msg.content}</p>
            </div>
             {msg.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                    <UserIcon />
                </div>
             )}
          </div>
        ))}
        {isLoading && isReady && 
          <div className="flex items-start gap-4 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white">
                <BotIcon />
            </div>
            <div className="max-w-lg p-4 rounded-2xl shadow bg-white text-gray-800 rounded-bl-none animate-pulse">
              <p className="text-sm">Pensando...</p>
            </div>
          </div>
        }
      </main>

      <footer className="bg-white p-4 border-t-2 border-gray-200">
        <form className="flex items-center gap-4" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Faça sua pergunta..."
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            disabled={!isReady || isLoading}
            className="flex-grow p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          />
          <button 
            type="submit" 
            disabled={!isReady || isLoading}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-300"
          >
            <SendIcon />
          </button>
        </form>
      </footer>
    </div>
  );
}

export default App;