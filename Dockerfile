FROM node:24-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy rest of the app
COPY . .

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
