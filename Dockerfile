FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000
ENTRYPOINT ["sh", "-c", "echo 'Server container is ready!'; npm start"]