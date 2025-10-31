FROM node:18.20.1-alpine

WORKDIR /app

# Copier package.json depuis le répertoire backend
COPY backend/package*.json ./

RUN npm install

# Copier tous les fichiers du backend
COPY backend .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
