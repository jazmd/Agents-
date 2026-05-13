FROM node:20-alpine
WORKDIR /app

COPY v3/goal_ui/package.json ./package.json
RUN npm install

COPY v3/goal_ui ./v3/goal_ui
WORKDIR /app/v3/goal_ui

CMD ["npm", "run", "dev:observability", "--", "--host", "0.0.0.0"]
