FROM node:20-alpine
WORKDIR /app

COPY v3/@claude-flow/visualizer/package.json ./package.json
RUN npm install

COPY v3/@claude-flow/visualizer ./v3/@claude-flow/visualizer
WORKDIR /app/v3/@claude-flow/visualizer

CMD ["npm", "run", "dev"]
