import React from 'react';

const STATUS_ICONS = {
  pending: 'pending-icon',
  running: 'running-icon',
  completed: 'completed-icon',
  error: 'error-icon',
};

export default function AgentTimeline({ agents }) {
  if (!agents.length) return null;

  return (
    <div className="agent-timeline">
      <h3>Agentes</h3>
      <div className="timeline-list">
        {agents.map((agent, i) => (
          <div key={agent.id} className={`timeline-item ${agent.status}`}>
            <div className="timeline-connector">
              <div className={`timeline-dot ${STATUS_ICONS[agent.status]}`} />
              {i < agents.length - 1 && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <span className="timeline-icon">{agent.icon}</span>
              <div>
                <div className="timeline-name">{agent.name}</div>
                <div className="timeline-status">
                  {agent.status === 'pending' && 'En espera'}
                  {agent.status === 'running' && 'Trabajando...'}
                  {agent.status === 'completed' && 'Completado'}
                  {agent.status === 'error' && 'Error'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
