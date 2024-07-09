# Usa l'immagine ufficiale di Node.js come base
FROM node:14

# Imposta la directory di lavoro nel container
WORKDIR /usr/src/app

# Copia i file package.json e package-lock.json nella directory di lavoro
COPY package*.json ./

# Installa le dipendenze del progetto
RUN npm install

# Copia il resto dei file del progetto nella directory di lavoro
COPY . .

# Espone la porta 2345
EXPOSE 2345

# Comando per avviare l'applicazione
CMD ["npm", "start"]
