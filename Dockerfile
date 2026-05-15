FROM node:20-slim

WORKDIR /app

COPY src/frontend/package.json src/frontend/package-lock.json* ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY src/frontend/ .
RUN npm run build

WORKDIR /app
COPY src/backend/package.json src/backend/package-lock.json* ./backend/
WORKDIR /app/backend
RUN npm install
COPY src/backend/ .

COPY normativas/ /app/normativas/

ENV PORT=3001
ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "server.js"]
