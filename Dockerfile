FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev 2>&1 && echo "npm install done"
RUN mkdir -p /app/data && echo "data dir created"
COPY . .
RUN echo "Files copied"
RUN node -e "console.log('Node works'); console.log('Express:', !!require('express')); console.log('WS:', !!require('ws'))" 2>&1
EXPOSE 3000
CMD ["node", "server.js"]
