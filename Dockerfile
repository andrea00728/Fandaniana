FROM node:18.20.1-alpine

WORKDIR /app

# Copier package.json et package-lock.json (si présent)
COPY package*.json ./

RUN npm install

# Copier tous les fichiers du projet
COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
