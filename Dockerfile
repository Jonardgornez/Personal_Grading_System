FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG DATABASE_URL="mysql://root:root@localhost:3306/student_grading"
ENV DATABASE_URL=$DATABASE_URL

RUN npx prisma generate && npm run build

CMD ["sh", "-c", "npx prisma db push && npm start"]
