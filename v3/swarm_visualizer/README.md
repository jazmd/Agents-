# Ruflo Swarm Visualizer MVP

Local development:

```bash
cd v3/@claude-flow/visualizer && npm install && npm run dev
cd v3/goal_ui && npm install && npm run dev:observability
```

Or with Docker:

```bash
docker compose -f v3/swarm_visualizer/docker/docker-compose.yml up --build
```

Endpoints:

- Backend health: `http://localhost:8787/api/health`
- WebSocket: `ws://localhost:8787/ws/visualizer`
- Frontend route: `http://localhost:8080/observability`
