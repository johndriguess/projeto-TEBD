import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// --- Ícones (sem alterações) ---
const SendIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2 .01 7z"/></svg> );
const FileIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A.75.75 0 0 0 21 12a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 0 0-1.5h-.75a.75.75 0 0 1-.75-.75V5.625c0-1.036-.84-1.875-1.875-1.875H16.5a.75.75 0 0 0-1.5 0H5.625ZM3 6a3 3 0 0 1 3-3h1.5v10.5H3V6ZM14.25 3A1.5 1.5 0 0 0 12.75 4.5h6a1.5 1.5 0 0 0-1.5-1.5h-3ZM6 13.5v6a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3v-6H6Z" clipRule="evenodd" /></svg> );
const GeminiIcon = () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.75C11.5858 2.75 11.25 3.08579 11.25 3.5V6.01256C11.25 6.42677 11.5858 6.76256 12 6.76256C12.4142 6.76256 12.75 6.42677 12.75 6.01256V3.5C12.75 3.08579 12.4142 2.75 12 2.75Z" fill="#F0F0F0"/><path d="M12 17.2374C11.5858 17.2374 11.25 17.5732 11.25 17.9874V20.5C11.25 20.9142 11.5858 21.25 12 21.25C12.4142 21.25 12.75 20.9142 12.75 20.5V17.9874C12.75 17.5732 12.4142 17.2374 12 17.2374Z" fill="#F0F0F0"/><path d="M16.9291 5.92914C16.6038 5.60388 16.0786 5.60388 15.7534 5.92914L14.075 7.60756C13.7497 7.93282 13.7497 8.458 14.075 8.78326C14.4002 9.10852 14.9254 9.10852 15.2507 8.78326L16.9291 7.10483C17.2544 6.77957 17.2544 6.2544 16.9291 5.92914Z" fill="#F0F0F0"/><path d="M8.78326 14.075C8.458 13.7497 7.93282 13.7497 7.60756 14.075L5.92914 15.7534C5.60388 16.0786 5.60388 16.6038 5.92914 16.9291C6.2544 17.2544 6.77957 17.2544 7.10483 16.9291L8.78326 15.2507C9.10852 14.9254 9.10852 14.4002 8.78326 14.075Z" fill="#F0F0F0"/><path d="M6.01256 11.25H3.5C3.08579 11.25 2.75 11.5858 2.75 12C2.75 12.4142 3.08579 12.75 3.5 12.75H6.01256C6.42677 12.75 6.76256 12.4142 6.76256 12C6.76256 11.5858 6.42677 11.25 6.01256 11.25Z" fill="#F0F0F0"/><path d="M20.5 11.25H17.9874C17.5732 11.25 17.2374 11.5858 17.2374 12C17.2374 12.4142 17.5732 12.75 17.9874 12.75H20.5C20.9142 12.75 21.25 12.4142 21.25 12C21.25 11.5858 20.9142 11.25 20.5 11.25Z" fill="#F0F0F0"/><path d="M8.78326 8.78326C9.10852 8.458 9.10852 7.93282 8.78326 7.60756L7.10483 5.92914C6.77957 5.60388 6.2544 5.60388 5.92914 5.92914C5.60388 6.2544 5.60388 6.77957 5.92914 7.10483L7.60756 8.78326C7.93282 9.10852 8.458 9.10852 8.78326 8.78326Z" fill="#F0F0F0"/><path d="M15.2507 15.2507C14.9254 14.9254 14.4002 14.9254 14.075 15.2507L12.3965 16.9291C12.0713 17.2544 12.0713 17.7796 12.3965 18.1048C12.7218 18.4301 13.247 18.4301 13.5722 18.1048L15.2507 16.4264C15.5759 16.1011 15.5759 15.5759 15.2507 15.2507Z" fill="#F0F0F0"/></svg> );

function App() {
  const [apiKey, setApiKey] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Olá! Para começar, por favor, insira sua chave de API do Google AI abaixo.' }
  ]);
  const [chatState, setChatState] = useState('AWAITING_API_KEY');
  const [isLoading, setIsLoading] = useState(false);
  
  const chatWindowRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessages(prev => [...prev, { role: 'file', content: file.name }]);
    setIsLoading(true);
    setChatState('PROCESSING_FILE');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('apiKey', apiKey);

    try {
      const response = await axios.post('http://127.0.0.1:5000/upload', formData);
      setMessages(prev => [...prev, { role: 'assistant', content: `Conhecimento do documento "${file.name}" foi adicionado! Você pode fazer perguntas ou enviar outro arquivo.` }]);
      setChatState('READY_TO_CHAT');
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message;
      setMessages(prev => [...prev, { role: 'assistant', content: `Ocorreu um erro: ${errorMessage}` }]);
      setChatState('READY_TO_CHAT');
    } finally {
      setIsLoading(false);
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };
  
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) return;

    if (chatState === 'AWAITING_API_KEY') {
      setApiKey(query);
      setMessages(prev => [
        ...prev,
        { role: 'user', content: '••••••••••••••••' },
        { role: 'assistant', content: 'Ótimo! Agora, por favor, clique no botão "+" para enviar um ou mais documentos.' }
      ]);
      setChatState('READY_TO_CHAT');
      setInputValue('');
      return;
    }

    if (chatState === 'READY_TO_CHAT') {
      const userMessage = { role: 'user', content: query };
      setMessages(prev => [...prev, userMessage]);
      setIsLoading(true);
      setInputValue('');

      try {
        const response = await axios.post('http://127.0.0.1:5000/ask', { question: query });
        const assistantMessage = { role: 'assistant', content: response.data.answer, sources: response.data.sources };
        
        setMessages(prev => [...prev, assistantMessage]);

      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        const assistantErrorMessage = { role: 'assistant', content: `Erro: ${errorMessage}` };
        
        setMessages(prev => [...prev, assistantErrorMessage]);

      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const getPlaceholder = () => {
    if (chatState === 'AWAITING_API_KEY') return 'Insira sua chave de API aqui...';
    return 'Faça uma pergunta ou resuma os documentos...';
  };

  return (
    <div className="app-container">
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => {
          if (msg.role === 'file') {
            return (
              <div key={index} className="file-message-container">
                <div className="file-message">
                  <FileIcon />
                  <span>{msg.content}</span>
                </div>
              </div>
            );
          }
          return (
            <div key={index} className={`message-container ${msg.role}`}>
              <div className="avatar">
                {msg.role === 'user' ? 'V' : <GeminiIcon />}
              </div>
              <div className="message">
                {msg.content}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="sources-container" style={{marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8}}>
                    <strong>Fontes:</strong>
                    <ul>
                      {msg.sources.map((source, idx) => (
                        <li key={idx} title={source.content_snippet}>Página {source.page}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
            <div className="message-container assistant">
                <div className="avatar"><GeminiIcon /></div>
                <div className="message">Pensando...</div>
            </div>
        )}
      </div>

      <div className="input-area">
        {chatState === 'AWAITING_API_KEY' ? (
          <form className="chat-input-form" onSubmit={handleFormSubmit}>
            <input
              type="password"
              placeholder={getPlaceholder()}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputValue}>
              <SendIcon />
            </button>
          </form>
        ) : (
          <div className="main-chat-input-container">
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.txt,.docx"
              style={{ display: 'none' }} 
              multiple={false}
            />
            <button className="upload-btn" onClick={() => fileInputRef.current.click()} disabled={isLoading}>
              +
            </button>
            <form className="chat-input-form" onSubmit={handleFormSubmit} style={{width: '100%'}}>
              <input
                type="text"
                placeholder={getPlaceholder()}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading || !inputValue}>
                <SendIcon />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;