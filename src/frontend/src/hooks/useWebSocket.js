import { useRef, useState, useCallback, useEffect } from 'react';

export function useWebSocket() {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [agents, setAgents] = useState([]);
  const [status, setStatus] = useState('idle');
  const [question, setQuestion] = useState(null);

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const url = `${protocol}://${host}/ws`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleMessage(data);
    };
  }, []);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        break;

      case 'session_start':
        setAgents(data.agents);
        setStatus('running');
        setMessages([]);
        setQuestion(null);
        addMessage('system', 'Busqueda iniciada. Los agentes estan trabajando...');
        break;

      case 'agent_start':
        setAgents(prev => prev.map(a =>
          a.id === data.agentId ? { ...a, status: 'running' } : a
        ));
        addMessage('agent', `${data.icon} ${data.agentName} ha comenzado a trabajar`, data.agentId);
        break;

      case 'agent_end':
        setAgents(prev => prev.map(a =>
          a.id === data.agentId ? { ...a, status: 'completed' } : a
        ));
        addMessage('agent', `${data.icon} ${data.agentName} ha terminado`, data.agentId);
        break;

      case 'agent_message':
        addMessage('agent', data.message);
        break;

      case 'agent_question':
        setQuestion(data.question);
        addMessage('question', data.question);
        break;

      case 'agent_log':
        break;

      case 'session_end':
        setStatus(data.status);
        if (data.outputFile) {
          addMessage('system', `Informe generado: ${data.outputFile}`);
        }
        addMessage('system', data.status === 'completed'
          ? 'Busqueda completada con exito.'
          : 'La busqueda termino con errores.');
        break;

      case 'error':
        addMessage('error', data.message);
        break;
    }
  }, []);

  const addMessage = useCallback((role, text, agentId) => {
    setMessages(prev => [...prev, {
      id: Date.now() + Math.random(),
      role,
      text,
      agentId,
      timestamp: new Date(),
    }]);
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const startSearch = useCallback((params) => {
    send({ type: 'start_search', ...params });
  }, [send]);

  const sendUserResponse = useCallback((message) => {
    setQuestion(null);
    addMessage('user', message);
    send({ type: 'user_response', message });
  }, [send, addMessage]);

  useEffect(() => {
    connect();
    return () => wsRef.current?.close();
  }, [connect]);

  return { connected, messages, agents, status, question, startSearch, sendUserResponse };
}
