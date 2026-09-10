FROM node:20
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev 2>&1
RUN mkdir -p data
COPY . .
EXPOSE 3000
CMD node server.js 2>&1
