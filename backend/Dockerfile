FROM node:18-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build
RUN npx prisma generate

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
