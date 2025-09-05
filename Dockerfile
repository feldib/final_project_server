FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies (including TypeScript and dev dependencies)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

EXPOSE 5000

# Run the compiled JavaScript
ENTRYPOINT ["sh", "-c", "echo 'Server container is ready!'; npm start"]