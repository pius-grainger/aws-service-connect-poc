FROM --platform=linux/amd64 node:18-slim

WORKDIR /app

COPY package.json .
RUN npm install

COPY app.js .

EXPOSE 8080

CMD ["node", "app.js"]