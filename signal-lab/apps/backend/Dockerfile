FROM node:20-alpine AS base
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client
COPY ../../prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3001
CMD ["npm", "run", "start:dev"]
