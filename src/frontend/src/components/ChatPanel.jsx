import React, { useRef, useEffect, useState } from 'react';

export default function ChatPanel({ messages, question, onSendResponse, status }) {
  const endRef = useRef(null);
  const [input, setInput] = useState('');

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendResponse(input.trim());
    setInput('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
            <div className="msg-header">
              {msg.role === 'agent' && <span className="msg-badge agent">Agente</span>}
              {msg.role === 'system' && <span className="msg-badge system">Sistema</span>}
              {msg.role === 'user' && <span className="msg-badge user">Tu</span>}
              {msg.role === 'question' && <span className="msg-badge question">Pregunta</span>}
              {msg.role === 'error' && <span className="msg-badge error">Error</span>}
              <span className="msg-time">
                {msg.timestamp.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="msg-text">{msg.text}</div>
          </div>
        ))}

        {status === 'running' && messages.length > 0 && (
          <div className="chat-msg chat-msg-typing">
            <div className="typing-dots">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder={question ? 'Responde a la pregunta del agente...' : 'Escribe un mensaje...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status !== 'running'}
        />
        <button type="submit" className="btn btn-send" disabled={!input.trim() || status !== 'running'}>
          Enviar
        </button>
      </form>
    </div>
  );
}
